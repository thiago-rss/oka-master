/**
 * Defineo esquema Mongoose para 'Room'. Resumo a seguir.
 * 
 *     - Room Host: obrigatório, aceita apenas letras
 *     - Room Name: obrigatório, aceita apenas caracteres ASCII, aceita de 1 a 24 caracteres
 *     - Room Password: opcional, apenas caracteres ASCII, até 100 caracteres
 *     - Room Code: obrigatório, aceita apenas letras; usado como identificador único da sala
 *     - Max Users: obrigatório, aceita de 2 a 50 usuários
 *     - Users: obrigatório, uma array de objetos para nomes, IDs únicos, e privilégios de dono da sala
 *     - Users Past: array de ex-usuários da sala; usuários que juntarem-se novamente à sala terão sua informação exibida aqui
 * 
 * @author thiagorss (Thiago Rosa)
 * @module models/room.model
 * @requires mongoose
 */

const mongoose = require('mongoose');

// Schema: Room
const schRoom = mongoose.Schema({
    roomHost: { type: String, required: true, unique: true, match: /^\w*$/, trim: true },
    roomName: { type: String, required: true, trim: true, minlength: 1, maxlength: 24 }, 
    roomPass: { type: String, match: /^[\x00-\x7F]*$/, trim: true, maxlength: 100 }, 
    roomCode: { type: String, required: true, unique: true, match: /^\w*$/, trim: true },
    maxUsers: { type: Number, required: true, min: 2, max: 50 },
    users: { type: [{
        realName: {type: String, match: /^\w*$/, required: true},
        dispName: {type: String, required: true, trim: true, minlength: 1, maxlength: 36},
        userId: {type: String, match: /^[\x00-\x7F]*$/, trim: true},
        isOwner: {type: Boolean, required: true}
    }], required: true },
    usersPast: { type: [{
        realName: {type: String},
        dispName: {type: String},
        userId: {type: String},
        isOwner: {type: Boolean}
    }]}
}, 
{
    timestamps: true
});

// Exporta esquema Room
module.exports = mongoose.model('Room', schRoom);