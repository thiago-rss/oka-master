/**
 * Arquivo que define as bases do back-end & server. Control interações em tempo real com o
 * Socket.IO, conecta com a database MongoDB Atlas, conecta as routes relevante estcua em uma port.
 * 
 * @author thiagorss (Thiago Rosa)
 * @requires express
 * @requires cors
 * @requires mongoose
 * @requires path
 * @requires body-parser
 * @requires cookie-parser
 * @requires express-session
 * @requires axios
 * @requires dotenv
 * @requires http
 * @requires socket.io
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const axios = require('axios');
const { JOIN_ROOM, REQ_VIDEO, END_VIDEO, SET_VID, SEND_MSG, SET_MSGS, UPD_MSGS, GET_VTIME, SET_VTIME, NAV_VTIME, GET_USERS, SET_PLAY, SEND_NTCE } = require('../src/Constants');

/** O bloco a seguir define a inicialização do server e do Socket.IO */
if (process.env.NODE_ENV !== 'production') require('dotenv').config({path: __dirname + '/./../.env'});
const port = process.env.PORT || process.env.REACT_APP_PORT || 5000;
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
io.on('connection', (socket) => {

    /**
     * Esse método organiza como um user ingressa numa room. Nenhuma informação pessoal é salva have, ingressa na room, recebe o
     * histórico de mensagens da room, e sincroniza o tempo do vídeo ao dos outros usuários da room.
     * 
     * @method
     */
    socket.on(JOIN_ROOM, async (data) => {

        // Bloco que salva ifnromações do usuário aqui
        socket.roomId = data.roomId;
        socket.userId = data.userId;
        socket.realName = data.realName;
        socket.dispName = data.dispName;
        socket.isOwner = data.isOwner;
        socket.join(socket.roomId);

        // Bloco que permite que o user obtenha mais informações sobre a sala: video atual, tempo do video, e histórico de mensagens
        const currVideoId = io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].videoId : "";
        io.in(socket.roomId).emit(GET_VTIME);
        io.in(socket.roomId).emit(SET_MSGS, {
            currMsgList: io.sockets.adapter.rooms[socket.roomId].currMsgList
        });

        // Bloco que sincroniza o player de video do user ao video e tempo da sala  ; funciona através de um fallback loop.
        const fallbackNoVideoTime = setInterval(() => {
            if (io.sockets.adapter.rooms[socket.roomId]) {

                // Afirma: essa room existe
                const newVideoTime = io.sockets.adapter.rooms[socket.roomId].videoTime;
                if (newVideoTime) {

                    // Afirma: esse video existe e seu tempo atual está em 'newVideoTime'
                    io.in(socket.roomId).emit(SET_VID, {
                        respVideo: currVideoId,
                        respVideoTime: newVideoTime
                    });
                    clearInterval(fallbackNoVideoTime);
                }
            }
            else {
                clearInterval(fallbackNoVideoTime);
            }
        }, 1000);
    });

    /**
     * Esse metodo organiza a requisição de video de um user; todos os users na sala terão
     * seus IDs de player de video modificados para a requisição do user  .
     * 
     * @method
     */
    socket.on(REQ_VIDEO, (data) => {
        if (io.sockets.adapter.rooms[socket.roomId]) {
            io.sockets.adapter.rooms[socket.roomId].videoId = data.query;
            io.in(socket.roomId).emit(SET_VID, {
                respVideo: io.sockets.adapter.rooms[socket.roomId].videoId
            });
        }
    });

    /**
     * Esse método organiza o fim do vídeo de um usuário. Força o fim do video para todos os users
     * garantingo que permanençam sincronizados. Isso é necessário para que o botão de play/pause funcione corretamente.
     * 
     * @method
     */
    socket.on(END_VIDEO, (data) => {
        io.in(socket.roomId).emit(END_VIDEO, {
            endTime: data.endTime
        });
    });

    /**
     * Esse método define o tempo do video globalmente, assim qualquer usuário da sala tem acesso a ele, incluindo novos usuários.
     * 
     * @method
     */
    socket.on(SET_VTIME, (data) => {
        io.sockets.adapter.rooms[socket.roomId].videoTime = data.currVideoTime;
    });

    /**
     * Esse metodo emite o número de users numa room para a mesma room.
     * 
     * @method
     */
    socket.on(GET_USERS, () => {
        io.in(socket.roomId).emit(GET_USERS, {
            userCount: io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].length : 0
        });
    });

    /**
     * Esse método emite um estado de reprodução específico para todos os users na room.
     * 
     * @method
     */
    socket.on(SET_PLAY, (data) => {
        io.in(socket.roomId).emit(SET_PLAY, {
            playVideo: data.playVideo
        });
    });

    /**
     * Esse método emite um tempo específico de navegação para todos users em uma room.
     * 
     * @method
     */
    socket.on(NAV_VTIME, (data) => {
        io.in(socket.roomId).emit(NAV_VTIME, {
            newTime: data.newTime
        });
    });

    /**
     * Esse método emite uma mensagem de um user para todos os users in the room. O display de mensagens é controlado por cinco fatores:
     * display name, real name (se aplicável), owner privileges, conteúdo da mensagem e liosta atual de messages.
     * 
     * @method
     */
    socket.on(SEND_MSG, (data) => {
        io.in(socket.roomId).emit(SEND_MSG, {
            senderDisp: data.senderDisp,
            senderReal: data.senderReal,
            senderIsOwner: data.senderIsOwner,
            msgContent: data.msgContent,
            currMsgList: data.currMsgList
        });
    });

    /**
     * Esse método emite uma nota para todos os users na room. O display de mensagens é controlled pelo conteúdo das
     * e atual lista de mensagens.
     * 
     * @method
     */
    socket.on(SEND_NTCE, (data) => {
        io.in(socket.roomId).emit(SEND_NTCE, {
            msgContent: data.msgContent,
            currMsgList: (io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].currMsgList : []) || []
        });
    });

    /**
     * Esse método emite uma nova lista de mensagens para todos os users na room. Isso é necessário para enviar mensagens em tempo real.
     * 
     * @method
     */
    socket.on(UPD_MSGS, (data) => {
        if (io.sockets.adapter.rooms[socket.roomId]) {
            io.sockets.adapter.rooms[socket.roomId].currMsgList = data.newMsgList;
        }
    });

    /**
     * Esse método organiza o disconnect do user. Diversas chamadas ocorrem aqui para simular a saída do user nos front-end & back-end.
     * 
     * @method
     */
    socket.on('disconnect', () => {

        // Atualiza a userCount; como ocorreu uma desconecção, o novo userCount é -1 do que o seu original
        io.in(socket.roomId).emit(GET_USERS, {
            userCount: io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].length : 0
        });

        // Esse bloco exibe uma notificação para todos os users em uma room sobre a saída de um user
        io.in(socket.roomId).emit(SEND_NTCE, {
            msgContent: `*${socket.dispName + (socket.realName ? (" (" + socket.realName + ")") : "")}* has left the room.`,
            currMsgList: (io.sockets.adapter.rooms[socket.roomId] ? io.sockets.adapter.rooms[socket.roomId].currMsgList : []) || []
        });

        // Essa chamada de API csimula a saída de um user, removendo o user da array de users da room
        axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/leave", {roomCode: socket.roomId, guestId: socket.userId})
            .catch(err => {
                // console.log(err)
            });
    });
});

/** O bloco a seguir ajusta o Express app. */
app.use(express.json());
app.use(cors({
    origin: ((process.env.NODE_ENV !== 'production') ? ['http://localhost:3000'] : ['http://cliquepj.herokuapp.com', 'https://cliquepj.herokuapp.com']),
    credentials: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

/** O bloco a seguir conecta o server ao MongoDB (Atlas) e mosta um indicador. */
mongoose.connect(process.env.REACT_APP_ATLAS_URI || 'mongodb://localhost/clique_app', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
mongoose.connection.on('connected', () => {
    console.log("[ Server ] Database connection established")
});

/** O bloco a seguir ajusta a sessão do cookies do express */
app.use(session({
    secret: `${process.env.REACT_APP_SESS_SECRET}`,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: true,
        httpOnly: true,
        maxAge: parseInt(process.env.REACT_APP_SESSION_LIFE + '000')
    }
}));

/** O bloco a seguir conecta as routes do API */
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'build')));
    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
    });
}

/** O bloco a seguir permite que o serve escute em uma porta e mosta um indicador. */
http.listen(port, () => {
    console.log(`[ Server ] Running on PORT: ${port}`);
});
