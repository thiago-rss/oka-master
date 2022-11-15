/**
 * Esse arquivo exporta os utilitarios de funções usados para  limpar o codigo front-end.
 * 
 * @author: thiagorss (Thiago Rosa)
 * @requires axios
 */

 import axios from 'axios';

/**
 * Essa função retorna a resposta do recebimento de users do server
 * 
 * @return {Object} Resposta do GET (...)/api/users
 */
const getUsersResponse = () => {
    return axios.get(process.env.REACT_APP_API_URL + "/api/users")
        .then(res => {
            return res.data;
        })
        .catch(err => {
            // console.log("Failed (1): " + err);
        });
}

/**
 * Essa função retorna o recebimento das rooms do server
 * 
 * @return {Object} The reponse from GET (...)/api/rooms
 */
const getRoomsResponse = () => {
    return axios.get(process.env.REACT_APP_API_URL + "/api/rooms")
        .then(res => {
            return res.data;
        })
        .catch(err => {
            // console.log("Failed (2): " + err);
        });
}

/**
 * Essa função cria uma sessão e retorna seus dados
 * 
 * @return {Object} Resposta do GET (...)/api/users/auth/verify
 */
const getSession = () => {
    return axios.get(process.env.REACT_APP_API_URL + "/api/users/auth/verify")
        .then(async (res) => {
            let retrieved = await axios.post(process.env.REACT_APP_API_URL + "/api/users/auth/retrieve", {id: res.data.id});
            if (retrieved.data && res) {
                retrieved.data.exp = res.data.exp;
            }
            return retrieved;
        })
        .catch(err => {
            // console.log("Failed (3): " + err);
        });
}

/**
 * Essa função cria uma sessão para uma room e retorna o token
 * 
 * @param {String} paramCode - Codigo da room
 * @param {String} paramId - ID único do user
 * @return {Object} Resposta do POST (...)/api/users/auth/obtain
 */
const createRoomSession = (paramCode, paramId) => {
    return axios.post(process.env.REACT_APP_API_URL + "/api/users/roomauth/obtain", {code: paramCode, id: paramId})
        .then(async () => {
            let payload = await axios.post(process.env.REACT_APP_API_URL + "/api/users/roomauth/verify");
            return payload;
        })
        .catch(err => {
            // console.log("Failed (4): " + err);
        });
}

/**
 * Essa função atualiza a lista de users da room quando alguém for adicionado
 * 
 * @param {String} guestNameReal - username do convidado, se possivel
 * @param {String} guestNameDisp - display do convidado / nome inicial
 * @param {String} guestId - ID unico do convidado
 * @param {String} roomCode - Codigo da room
 * @return {Object} Resposta do PATCH (...)/api/rooms/enter
 */
const addRoomUser = (guestNameReal, guestNameDisp, guestId, roomCode) => {
    return axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/enter", {dispName: guestNameDisp, roomCode: roomCode, guestName: guestNameReal, guestId: guestId})
        .then((res) => {
            return res.data;
        })
        .catch(err => {
            // console.log("Failed (5): " + err);
        });
}

/**
 * This function updates a room's users when removing a user
 * 
 * @param {String} guestId - The guest's unique ID
 * @param {String} roomCode - The room code
 * @return {Object} The reponse from PATCH (...)/api/rooms/enter
 */
const removeRoomUser = (guestId, roomCode) => {
    return axios.patch(process.env.REACT_APP_API_URL + "/api/rooms/leave", {roomCode: roomCode, guestId: guestId})
        .then((res) => {
            return res.data;
        })
        .catch(err => {
            // console.log("Failed (6): " + err);
        });
}

/**
 * Essa função provisiona um codigo serial único composto apenas por caracteres alfanumeros minusculos. É utilizada para criar IDs de usuários.
 * 
 * @return {String} ID unico
 */
const genUniqueId = () => {
    return "?" + (new Date()).getTime().toString(36);
}

// Exporta todas as funções  como um objeto de funções
export default {getUsersResponse, getRoomsResponse, getSession, createRoomSession, addRoomUser, removeRoomUser, genUniqueId};