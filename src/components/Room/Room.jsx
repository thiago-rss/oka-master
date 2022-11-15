import React, { useEffect, useState, useRef, useCallback } from 'react';
import RoomNavbar from './RoomNavbar/RoomNavbar';
import VideoPicker from './VideoPicker/VideoPicker';
import VideoPlayer from './VideoPlayer/VideoPlayer';
import RoomChatFooter from './RoomChatFooter/RoomChatFooter';
import Footer from '../Footer/Footer';
import queryString from 'query-string';
import urlChecker from 'is-url';
import styles from './Room.module.css';
import axios from 'axios';
import io from "socket.io-client";
import { JOIN_ROOM, REQ_VIDEO, END_VIDEO, SET_VID, SEND_MSG, SET_MSGS, UPD_MSGS, GET_VTIME, SET_VTIME, NAV_VTIME, GET_USERS, SET_PLAY, SEND_NTCE } from '../../Constants';



function Room(props) {

    /* === States & Constants === */
    const roomSocket = useRef(null);
    const [startTime, setStartTime] = useState(0);
    const [skipTime, setSkipTime] = useState(0);
    const [currVideoTime, setCurrVideoTime] = useState(0);
    const [roomUserCount, setRoomUserCount] = useState(0);
    const [offsetExecTime, setOffsetExecTime] = useState((new Date()).getTime());
    const [roomVideo, setRoomVideo] = useState("");
    const [userMetadata, setUserMetadata] = useState({});
    const [playVideo, setPlayVideo] = useState(false);
    const [isUserAllowed, setIsUserAllowed] = useState(false);
    const [videoResults, setVideoResults] = useState([]);
    const [msgList, setMsgList] = useState([]);
    const INITIAL_VIDEO_ID = "e2qG5uwDCW4";
    const MAX_CHAT_MESSAGES = 100;

    /*
    Essa função adiciona umaa mensagem na message list, simulando um "send".
    */
    const sendMessage = (paramSenderDisp, paramSenderReal, paramSenderIsOwner, paramContent, paramMsgList) => {
        const newMsgTime = new Date();
        const newMsgNode = {
            notice: false,
            content: paramContent,
            key: newMsgTime.getTime(),
            senderDisp: paramSenderDisp,
            senderReal: paramSenderReal,
            senderIsOwner: paramSenderIsOwner,
            timestamp: [newMsgTime.getHours(), newMsgTime.getMinutes(), newMsgTime.getSeconds()]
        };
        
        // <ChatMessage senderDisp={paramSenderDisp} senderReal={paramSenderReal} senderIsOwner={paramSenderIsOwner} content={paramContent} timestamp={newMsgTime} key={newMsgTime.getTime()} />;
        appendMsgNode(newMsgNode, paramMsgList);
    }

    /*
    Essa função adiciona uma notificação na message list, simulando um "send".
    */
    const sendNotice = (paramContent, paramMsgList) => {
        const newNoticeTime = new Date();
        const newNoticeNode = {
            notice: true,
            content: paramContent,
            key: newNoticeTime.getTime()
        };
        
        // <ChatMessage notice={true} content={paramContent} key={newNoticeTime.getTime()} />;
        appendMsgNode(newNoticeNode, paramMsgList);
    }

    /*
    Essa função callback adiciona uma "message node" à message list, enquanto mantem o número máximo de mensagens no chat.
    */
    const appendMsgNode = (paramNode, paramMsgList) => {
        let newMsgList = paramMsgList;
        if (newMsgList.length >= MAX_CHAT_MESSAGES) {
            newMsgList.shift();
        }
        newMsgList = newMsgList.concat([paramNode]);
        roomSocket.current.emit(UPD_MSGS, { newMsgList: newMsgList });
        setMsgList(newMsgList);
    }
    
    /*
    Essa função organiza automaticamente o unloading do navegador na room.
    */
    window.onbeforeunload = () => {
        roomSocket.current.close();
    }

    /*
    Essa função acompanha tempo atual video em reprodução.
    */
    const handleTimeTrack = (paramCurrVideoTime) => {
        // console.log("Room: " + paramCurrVideoTime + ", currently (but untrust): " + currVideoTime);
        setCurrVideoTime(paramCurrVideoTime);
    }

    /*
    Essa função acompanha o estado de reprodução no fame de video. Espera um valor booleano para saber se o video está em reprodução.
    */
    const handlePlayTrack = (paramPlayVideo) => {
        setPlayVideo(paramPlayVideo);
    }

    /*
    Essa função acompanha qualquer passagem de vídeo que ocorra na room. Espera um parametro com um valor entre 0 e a duração total do video.
    */
    const handleSkipTrack = (paramSkipTime) => {
        // console.log("Room > Skip to: " + paramSkipTime)
        setSkipTime(paramSkipTime);
    }

    /*
    Ess função maneja o final do video e repassa para todos os users na room. Espera um parametro com o valor da duração total do vídeo.
    */
    const handleVideoEnd = (paramEndTime) => {
        roomSocket.current.emit(END_VIDEO, {
            endTime: paramEndTime
        });
    }

    /*
    Essa função controla o click no card de video, reproduzindo o video selecionado para todos os users.
    */
    const handleCardClick = (paramVideoId) => {
        roomSocket.current.emit(REQ_VIDEO, { query: paramVideoId });
        window.scrollTo(0, 0);
    }

    /*
    Essa função controla o envio de mensagens por um usuário, garantindo que a mensagem chegue para todos presentes na room.
    */
    const handleSendMsg = (paramSenderDisp, paramSenderReal, paramSenderIsOwner, paramContent) => {
        roomSocket.current.emit(SEND_MSG, { senderDisp: paramSenderDisp, senderReal: paramSenderReal, senderIsOwner: paramSenderIsOwner, msgContent: paramContent, currMsgList: msgList });
    }

    /*
    Essa função acompanha o estado da search bar contida na RoomNavbar e chama a função.
    Também organiza o query da search bar ("queryInput") dos usuários ("userMetadata"), emitindo o video para todos os users da room.
    */
    const handleNavbarInput = async (paramQueryInput) => {
        paramQueryInput = paramQueryInput.trim();
        
        if (paramQueryInput) {

            // Extrai URL se possivel
            let urlExtractor = document.createElement('a');
            urlExtractor.href = paramQueryInput;
            const inputHostnameParts = urlExtractor.hostname.split('.');
            const inputQueryParameters = queryString.parse(urlExtractor.search);
            // console.log(urlChecker(paramQueryInput) + ":" + inputHostnameParts.includes('youtube') + ":" + inputQueryParameters.v);

            if (urlChecker(paramQueryInput) && inputHostnameParts.includes('youtube') && inputQueryParameters.v) {
                // Usa um truque de identificação da  thumbnail do video para checar se o ID é válido
                var img = new Image();
                img.src = "http://img.youtube.com/vi/" + inputQueryParameters.v + "/mqdefault.jpg";
                img.onload = () => {
                    if (img.width !== 120) {
                        // REQ_VIDEO para qualquer lind direto do YouTube na query
                        roomSocket.current.emit(REQ_VIDEO, { query: inputQueryParameters.v });
                    }
                    else if (inputQueryParameters.v) {
                        // Em queris de video válias (case-sensitive)
                        getYTQuerySearch(inputQueryParameters.v);
                    }
                }
            }
            else {
                // Youtube API: GET request para pesquisa 
                getYTQuerySearch(paramQueryInput);
            }
        }
        else {
            setVideoResults([]);
        }
    }

    /*
    Essa função faz requisições de pesquisa assincronas no Youtube a partir do query input, exibindo os resultados de video para a Room se possível.
    */
    const getYTQuerySearch = async (paramQueryInput, proxy = 'https://cors-anywhere.herokuapp.com/') => {
        await axios.get(proxy + 'https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: process.env.REACT_APP_YT_SECRET,
                q: paramQueryInput,
                maxResults: 50,
                part: 'snippet',
                type: 'video',
                videoEmbeddable: 'true'
            }})
            .then(res => {
                if (res.data && res.data.items) {
                    const searchResultsArr = res.data.items;
                    setVideoResults(searchResultsArr);
                }
            })
            .catch(err => {
                // console.log(err);
            });
    }

    /*
    Essa função callback organiza os eventos de inicio no socket de vídeo.
    */
    const handleSocket = useCallback((socket, creds) => {
        roomSocket.current = socket;

        socket.on('connect', async () => {

            setOffsetExecTime((new Date()).getTime());

            let realName = "";
            let dispName = "";
            let isOwner = false;
            await axios.post(process.env.REACT_APP_API_URL + "/api/rooms/userinfo", {roomCode: creds.roomCode, userId: creds.userId})
                .then(resUserObject => {
                    if (resUserObject && resUserObject.data) {
                        realName = resUserObject.data.realName;
                        dispName = resUserObject.data.dispName;
                        isOwner = resUserObject.data.isOwner;
                    }
                })
                .catch(err => {
                    // console.log(err);
                });
            setUserMetadata({realName: realName, dispName: dispName, isOwner: isOwner});

            if (dispName) {
                // Alguém se juntou à room; tem um name real, name de displahy, e alguns privilégios.
                socket.emit(JOIN_ROOM, {
                    roomId: creds.roomCode,
                    userId: creds.userId,
                    realName: realName,
                    dispName: dispName,
                    isOwner: isOwner
                });
                socket.emit(GET_USERS);
                socket.emit(SEND_NTCE, { msgContent: `*${dispName + (realName ? (" (" + realName + ")") : "")}* has joined the room.` });
            }
            else {
                // Return para /rooms se estiver anônimo (i.e. essa pessoa não permite cookies)
                window.location.pathname = "/rooms";
            }
        });

        socket.on(END_VIDEO, (data) => {
            setSkipTime(data.endTime);
        });

        socket.on(SET_VID, (data) => {
            if (data.respVideo) {
                setRoomVideo(data.respVideo);
            }
            if (data.respVideoTime) {
                setStartTime(data.respVideoTime);
            }
        });

        socket.on(GET_USERS, (data) => {
            if (data.userCount) {
                // console.log("User Count: " + data.userCount);
                setRoomUserCount(data.userCount);
            }
        });

        socket.on(SET_PLAY, (data) => {
            if (data.playVideo !== undefined) {
                setPlayVideo(data.playVideo);
            }
        });

        socket.on(NAV_VTIME, (data) => {
            if (data.newTime !== undefined) {
                // console.log("Room > NAV_VTIME (recv): newTime = " + data.newTime);
                setSkipTime(data.newTime);
            }
        });

        socket.on(SEND_MSG, (data) => {
            sendMessage(data.senderDisp, data.senderReal, data.senderIsOwner, data.msgContent, data.currMsgList);
        });

        socket.on(SEND_NTCE, (data) => {
            sendNotice(data.msgContent, data.currMsgList);
        });

        socket.on(SET_MSGS, (data) => {
            setMsgList(data.currMsgList ? data.currMsgList : []);
        });
    }, [props.room.match.params.code]);

    /*
    Essa função useEffect é chamada no start, iniciando o ID de video da room e o componente é re-renderizado.
    */
    useEffect(() => {
        if (!roomVideo) {
            // Inicializa um video se a Room ainda não tiver um video reproduzindo
            // console.log("Room > setRoomVideo: videoId = " + (roomSocket.current ? roomSocket.current.videoId : INITIAL_VIDEO_ID));
            setRoomVideo(roomSocket.current ? roomSocket.current.videoId : INITIAL_VIDEO_ID);
        }
    }, [roomVideo]);

    /*
    Essa função useEffect é chamada quando alguém interagem com a barra de navegação de tempo; o tempo no socket de video será alterado para a posição selecionada.
    */
    useEffect(() => {
        const socket = roomSocket.current || io(process.env.REACT_APP_API_URL);
        // console.log("Room > NAV_VTIME (sent): newTime = " + skipTime);
        socket.emit(NAV_VTIME, {
            newTime: skipTime
        });
    }, [skipTime]);

    /*
    Essa função useEffect atualiza o tempo atual do video no server.
    */
    useEffect(() => {
        const socket = roomSocket.current || io(process.env.REACT_APP_API_URL);
        socket.off(GET_VTIME);
        socket.on(GET_VTIME, () => {
            // console.log("Room > GET_VTIME: currVideoTime = " + currVideoTime);
            socket.emit(SET_VTIME, {
                currVideoTime: currVideoTime
            });
        });
    }, [currVideoTime]);

    /*
    Essa função useEffect executa o estado "playVideo" no socket.
    */
    useEffect(() => {
        const socket = roomSocket.current || io(process.env.REACT_APP_API_URL);
        socket.emit(SET_PLAY, {
            playVideo: playVideo
        });
    }, [playVideo]);

    /*
    Essa função useEffect é chamada na inicialização, organizando as propriedadas da Room, configurando o socket, e validando a sessão do user.
    */
    useEffect(() => {
        
        const setupRoom = async () => {
            //Verificação e configuração do Token da Room 
            const resRoomSession = await axios.post(process.env.REACT_APP_API_URL + "/api/users/roomauth/verify");
            const foundRoomCode = props.room.match.params.code || "";
            if (!resRoomSession.data || !foundRoomCode || (resRoomSession.data.roomCode !== foundRoomCode)) {
                window.location.href = "/";
                return;
            }
            
            // ID -> Propriedades do User
            const foundSessId = resRoomSession.data.id || "";
            // console.log({roomCode: foundRoomCode, userId: foundSessId, realName: realName, dispName: dispName, isOwner: isOwner});

            //Implementação do Socket.IO 
            const socket = io(process.env.REACT_APP_API_URL) || roomSocket.current;
            handleSocket(socket, {roomCode: foundRoomCode, userId: foundSessId});
            setIsUserAllowed(true);
        }
        setupRoom();

    }, [handleSocket, props.room.match.params.code]);

    /*
    Essa função return simula uma room inteira: Contendo uma "search bar", um "video player", um "room chat", e uma "user list" que são todos criados como sub-componentes da página.
    */
    return (
        <>
            {isUserAllowed ?
            <>
                <RoomNavbar searchHandler={handleNavbarInput} />
                <div className={styles.videoPlayerWrapper}>
                    <div className={styles.videoPlayer}>
                        <VideoPlayer
                          videoId={roomVideo}
                          isPlaying={playVideo}
                          offsetExecTime={offsetExecTime}
                          startTime={startTime}
                          skipTime={skipTime}
                          userCount={roomUserCount}
                          timeHandler={handleTimeTrack}
                          playHandler={handlePlayTrack}
                          skipHandler={handleSkipTrack}
                          endObserver={handleVideoEnd}
                        />
                    </div>
                </div>
                <div className={styles.pickerContainer}>
                    <VideoPicker videoResults={videoResults} clickHandler={handleCardClick} />
                </div>
                <Footer />
                <RoomChatFooter userMetadata={userMetadata} msgList={msgList} handleSendMsg={handleSendMsg} />
            </>
            :
            <div />}
        </>
    )
}

export default Room;