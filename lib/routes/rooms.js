/**
 * Arquivo que define routes para os endpoints esperados em 'api/rooms/'. Suporta as seguintes funções:
 * 
 *     - GET / => Obtém uma array de todas as rooms na database
 *     - POST /userinfo => Obtém um user (ou "past user" se aplicavel) de uma sala especificada
 *     - POST /create => Cria uma room e adiciona à database
 *     - PATCH /enter => Simula um user entrando na room adicionando ele à lista de users da room
 *     - PATCH /leave => Simula um user saindo da room removmento ele da lista de users da room
 *     - DELETE /remove => Deleta uma room da database
 * 
 * @author: thiagorss (Thiago Rosa)
 * @requires express
 * @requires axios
 */

const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Room = require('../models/room.model');
 
/**
 * Funcão que provisiona um "time-unique serial code" composto por caracteres alfanumericos (minusculos).
 * 
 * @return {String} Tempo (em millisegundos) em base-36
 */
const createRoomCode = () => {
    return (new Date()).getTime().toString(36);
}

/**
 * Route que obtém uma array de todas as rooms na database.
 * 
 * @route GET api/rooms
 * @method
 */
router.get('/', auth, (req, res) => {
    Room.find()
        .then(rooms => res.json(rooms))
        .catch(err => {
            // res.status(400).json('[ Router GET ./rooms ] ' + err)
        });
});

/**
 * Route que obtém um user (ou "past user" se aplicável) de uma room específica.
 * 
 * @route POST api/rooms/userinfo
 * @method
 */
router.post('/userinfo', auth, (req, res) => {

    Room.findOne({roomCode: req.body.roomCode})
        .then(roomSelected => {
            let roomUsers = roomSelected ? roomSelected.users : [];
            let foundStatus = false;

            // Bloco que busca um user na room pelo user ID
            roomUsers.forEach(user => {
                if (user.userId === req.body.userId) {
                    
                    // Se user for encontrado, retorna o user na resposta
                    foundStatus = true;
                    res.json(user);
                    return;
                }
            });

            // Afirma: the user não foi encontrado na room
            if (!foundStatus) {
                let roomUsersPast = roomSelected ? roomSelected.usersPast : [];
                let foundStatusForPast = false;

                // Bloco que procura um "PAST" user na room pelo user ID
                roomUsersPast.forEach((user) => {
                    if (user.userId === req.body.userId) {

                        const enterRoomConfig = {
                            dispName: user.dispName,
                            roomCode: req.body.roomCode,
                            guestName: user.realName,
                            guestId: user.userId,
                            isOwner: user.isOwner
                        };

                        // Metodo chamado ao se juntar a uma room, o "PAST" user encontrado pode ser adicionado à lista de users "PRESENT"
                        axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/enter", enterRoomConfig)
                            .catch(err => {
                                // console.log(err)
                            });

                        // Se o "PAST" user for encontrado, retorna o user na resposta
                        foundStatusForPast = true;
                        res.json(user);
                        return;
                    }
                });

                if (!foundStatusForPast) {
                    // Resposta vazia para tentativas falhas de encontrar user
                    res.json({});
                }
            }
        })
        .catch(err => {
            // res.status(400).json('[ Router POST ./userinfo ]' + err)
        });
});

/**
 * Route que cria uma room e adiciona à database.
 * 
 * @route POST api/rooms/create
 * @method
 */
router.post('/create', auth, (req, res) => {
    const roomHost = req.body.host;
    const roomHostId = req.body.hostId;
    const roomName = req.body.name;
    const roomPass = req.body.password ? req.body.password : "";
    const roomCode = createRoomCode();
    const maxUsers = req.body.usercap;

    // Adiciona uma nova room dadas as propriedades
    const newRoom = new Room({ roomHost, roomName, roomPass, roomCode, maxUsers: maxUsers, users: [
        {realName: roomHost, dispName: roomHost, userId: roomHostId, isOwner: true}
    ]});
    newRoom.save()
        .then(() => res.json({code: `${roomCode}`}))
        .catch(err => {
            // res.status(400).json('[ Router POST ./rooms/create ] ' + err)
        });
});

/**
 * Route que simula a entrada de um user na room adicionando à lista de users da sala room.
 * 
 * @route PATCH api/rooms/enter
 * @method
 */
router.patch('/enter', auth, (req, res) => {
    const roomCode = req.body.roomCode;
    const guestNameDisp = req.body.dispName;
    const guestNameReal = req.body.guestName ? req.body.guestName : "";
    const guestId = req.body.guestId;
    const userIsOwner = req.body.isOwner || false;

    //  Encontra uma room usando o roomCode, e adiciona um novo user (objeto listado abaixo) aos seus 'users'
    Room.findOneAndUpdate({roomCode: roomCode}, {$push: {users: {realName: guestNameReal, dispName: guestNameDisp, userId: guestId, isOwner: userIsOwner}}})
        .then(() => {
            // Se a entrada for bem sucedida, remove o user da lista "PAST" users se aplicável.
            Room.findOneAndUpdate({roomCode: roomCode}, {$pull: {usersPast: {userId: guestId}}});
            res.json(`[ Router PATCH ./enter ] Successfully added: ${guestNameDisp} to Room ${roomCode}`);
        })
        .catch(err => {
            // res.status(400).json('[ Router PATCH ./enter ] ' + err);
        });
});

/**
 * Route que simula a saída de um user da room by removendo-o da user list.
 * 
 * @route PATCH api/rooms/leave
 * @method
 */
router.patch('/leave', (req, res) => {
    const roomCode = req.body.roomCode;
    const guestId = req.body.guestId;

    // Bloco que encontra uma room usando o roomCode, e remove um user pelo ID específico
    Room.findOneAndUpdate({roomCode: roomCode}, {$pull: {users: {userId: guestId}}})
        .then(async (data) => {

            // Bloco que deletes a room se não houver mais ninguém nela (dentro de 3 segundos); funciona como garbage collection
            setTimeout(() => {
                Room.findOne({roomCode: roomCode})
                    .then(async (roomInfo) => {
                        if (roomInfo && roomInfo.users && (roomInfo.users.length === 0)) {

                            // Assert: depois de 3 seconds, room sem users
                            await Room.findOneAndDelete({roomCode: roomCode})
                                .catch(err => {
                                    // console.log(err);
                                    res.status(400).json('[ Router PATCH ./leave (1) ] ' + err);
                                });
                        }
                    })
                    .catch(err => {
                        // console.log(err);
                        res.status(400).json('[ Router PATCH ./leave (2) ] ' + err);
                    });
            }, 3000);

            // Se ainda houver alguém na room, guarda o user como "PAST" user (se já não estiver na lista)
            if (data && data.users) {
                data.users.forEach(user => {
                    if (user.userId === guestId) {
                        
                        // Atribui foundInPast -> quando user com o ID foi encontrado na lista de 'usersPast'
                        let foundInPast = false;
                        for (let pastUser of data.usersPast) {
                            if (pastUser.userId === guestId) {
                                foundInPast = true;
                                break;       
                            }
                        }

                        if (!foundInPast) {

                            // Afirma: não foi encontrado no arry 'usersPast'; user pode ser adicionado a 'usersPast'
                            Room.findOneAndUpdate({roomCode: roomCode}, {$push: {usersPast: {realName: user.realName, dispName: user.dispName, userId: user.userId, isOwner: user.isOwner}}})
                                .catch(err => {
                                    // console.log(err)
                                });
                        }
                    }
                });
            }

            res.json(`[ Router PATCH ./leave ] Successfully removed: ${guestId} from Room ${roomCode}`);
        })
        .catch(err => {
            // res.status(400).json('[ Router PATCH ./leave (3) ] ' + err);
        });
});

/**
 * Route que tenta deletar uma room da database.
 * 
 * @route PATCH api/rooms/remove
 * @method
 */
router.delete('/remove', auth, (req, res) => {
    const roomCode = req.body.roomCode;

    // Bloco procura uma room pelo roomCode, e deleta se existir
    Room.findOneAndDelete({roomCode: roomCode})
        .then(() => res.json(`[ Router DELETE ./remove ] Successfully removed: Room ${roomCode}`))
        .catch(err => res.status(400).json('[ Router DELETE ./remove ] ' + err));
});

// Exporta Express router com todas as funcionalidades relacionadas às rooms
module.exports = router;