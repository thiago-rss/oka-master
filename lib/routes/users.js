/**
 * Arquivo que define routes para os endpoint em 'api/users/'. Suporta as seguintes funcões:
 * 
 *     - GET / => Obtém uma array de todos os users na database
 *     - POST /auth/retrieve => Recupera a informação sobre um user pelo ID
 *     - GET /auth/verify => Verifica um token determinado e retorna seu conteúdo se bem sucedido
 *     - POST /auth/clear => Limpa a sessão deste usuário
 *     - POST /auth/obtain => Permite que o user obtenha uma sessão, através das cedencias via sistema de logins e flags.
 *     - POST /roomauth/verify => Verifica um token para a sessão dentro de umaa room and retorna seu conteúdo se bem sucedido
 *     - POST /roomauth/obtain => Permite que o usuário obtenha a sessão dentro da room
 *     - POST /add => Adiciona um user à database
 *     - POST /delete => Deleta um user da database
 *     - POST /permit => Obtain um "short-lifetime token" para chamadas de APIs, espera ser chamado frequentemente
 * 
 * NOTA: algumas funciões aqui podem usar o MemoryStore para guardar sessões!
 * 
 * @author: thiagorss (Thiago Rosa)
 * @requires express
 * @requires jsonwebtoken
 */

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const auth = require('../middleware/auth');

/**
 * Route que obtém uma array de todos users na database.
 * 
 * @route GET api/users
 * @method
 */
router.get('/', auth, (req, res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json('[ Router GET ./users/ ] ' + err));
});

/**
 * Route que recupera informações sobre um user pelo ID.
 * 
 * @route POST api/users/auth/retrieve
 * @method
 */
router.post('/auth/retrieve', auth, (req, res) => {

    // Seleciona informações pública & email somente
    User.findById(req.body.id)
        .select('-password -createdAt -updatedAt -__v')
        .then(user => res.json(user))
        .catch(err => res.status(400).json('[ Router GET ./users/auth/retrieve ] ' + err));
});

/**
 * Route que verifica um token e retorna seu contúdo se bem sucedido.
 * 
 * @route GET api/users/auth/verify
 * @method
 */
router.get('/auth/verify', auth, (req, res) => {
    if (req.sessionStore.sessions) {
        try {
            let sessionAsJSON = JSON.parse(Object.values(req.sessionStore.sessions).slice(-1)[0]);
            let payload = jwt.verify(sessionAsJSON.token, process.env.REACT_APP_JWT_SECRET);
            res.send(payload);
        }
        catch (err) {
            res.end();
        }
    }
    res.end();
});

/**
 * Route que limpa a sessão do usuário
 * 
 * @route POST api/users/auth/clear
 * @method
 */
router.post('/auth/clear', auth, (req, res) => {
    req.sessionStore.clear();
    res.end();
});

/**
 * Route que permite que o user crie uma sessão, das as credenciais credentials no
 * sistema de logins e flags.
 * 
 * @route POST api/users/auth/obtain
 * @method
 */
router.post('/auth/obtain', auth, (req, res) => {
    const email = req.body.email.toUpperCase();
    const password = req.body.password ? req.body.password : "";
    const ignorePass = req.body.ignorePass ? req.body.ignorePass : false;

    User.findOne({email: email})
        .then(user => {
            if (!user) return res.status(400).json('[ Router POST ./users/auth/obtain ] Non-existant user');

            // Afirma: Existe um user com esse email
            user.validPassword(password)
                .then(isMatch => {
                    if (!isMatch && !ignorePass) return res.status(400).json('[ Router POST ./users/auth/obtain ] Invalid credentials');

                    // Afirma: este user tem email & password corretos
                    jwt.sign(
                        {id: user._id},
                        process.env.REACT_APP_JWT_SECRET,
                        {expiresIn: parseInt(process.env.REACT_APP_SESSION_LIFE)},
                        (err, token) => {
                            if (err) throw err;
                            
                            // Afirma: JWT criado com sucesso
                            // Aviso: pode resetar os tokens da sessão da room também
                            req.sessionStore.clear();
                            req.session.token = token;
                            res.json({
                                token: token
                            });
                            res.end();
                        }
                    );
                })
        })
        .catch(err => {
            // console.log(err)
        });
});

/**
 * Route que verifica o token da sessão na room e retorna
 * seu conteúdo se bem sucedido.
 * 
 * @route POST api/users/roomauth/verify
 * @method
 */
router.post('/roomauth/verify', (req, res) => {
    if (req.sessionStore.sessions) {
        try {
            let sessionAsJSON = JSON.parse(Object.values(req.sessionStore.sessions).slice(-1)[0]);
            let payload = jwt.verify(sessionAsJSON.tokenRoom, process.env.REACT_APP_JWT_SECRET);
            res.send(payload);
        }
        catch (err) {
            res.end();
        }
    }
    res.end();
});

/**
 * Route que permite que o user obtenha uma sessão na room.
 * 
 * @route POST api/users/roomauth/obtain
 * @method
 */
router.post('/roomauth/obtain', auth, (req, res) => {
    const roomCode = req.body.code;
    const userId = req.body.id ? req.body.id : "";

    jwt.sign(
        {roomCode: roomCode, id: userId},
        process.env.REACT_APP_JWT_SECRET,
        (err, tokenRoom) => {
            if (err) throw err;
            
            // Assert: JWT criado com sucesso
            req.session.tokenRoom = tokenRoom;
            res.json({
                token: tokenRoom
            });
            res.end();
        }
    );
});

/**
 * Route que adiciona um user na database,
 * 
 * @route POST api/users/add
 * @method
 */
router.post('/add', auth, (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email.toUpperCase();

    const newUser = new User({username: username, email: email});
    newUser.password = newUser.generateHash(password);

    newUser.save()
        .then(user => {

            jwt.sign(
                {id: user._id},
                process.env.REACT_APP_JWT_SECRET,
                {expiresIn: parseInt(process.env.REACT_APP_SESSION_LIFE)},
                (err, token) => {
                    if (err) throw err;

                    // Assert: JWT created successfully
                    res.json({
                        token: token
                    });
                }
            );
        })
        .catch(err => res.status(400).json('[ Router POST ./users/add ] ' + err));
});

/**
 * Route que deleta um user da database.
 * 
 * @route POST api/users/delete
 * @method
 */
router.post('/delete', auth, (req, res) => {
    const username = req.body.username;

    User.findOneAndDelete({username: username})
        .then(res.json({found: true}))
        .catch(err => res.status(400).json('[ Router DELETE ./users/delete ] ' + err));
});

/**
 * Route que obtém um "short-lifetime token" para chamadas de APIs, espera ser chamado frequentemente.
 *
 * 
 * @route POST api/users/permit
 * @method
 */
router.post('/permit', (req, res) => {
    jwt.sign(
        {apiKey: process.env.REACT_APP_PERMIT_KEY},
        process.env.REACT_APP_JWT_SECRET,
        {expiresIn: 2},
        (err, token) => {
            if (err) throw err;

            // Assert: JWT created successfully
            res.json({
                token: token
            });
        }
    );
});

// Exporta o Express router com todas as funcões relacionadas ao user
module.exports = router;