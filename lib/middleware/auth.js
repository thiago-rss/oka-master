/**
 * Arquivo utilizado para autenticar chamadas de API, com ajuda do componente Permitter para
 * resolver o problema do 'api-auth-pass' na inicialização.
 * 
 * @author thiagorss (Thiago Rosa)
 * @module auth
 * @requires jsonwebtoken
 */

const jwt = require('jsonwebtoken');

/**
 * Função middleware para assegurar chamadas para a APT users & rooms. 
 * header do Permitter para garantir que chamadas do API sejam feitas apenas pelo website.
 * 
 * @function auth
 */
function auth(req, res, next) {
    const token = req.header('api-auth-pass');

    if (!token) {
        res.status(401).json({ status: 'Access denied' });
    }
    else {
        const decoded = jwt.verify(token || "", process.env.REACT_APP_JWT_SECRET);
        if (!(decoded && decoded.apiKey && (decoded.apiKey === process.env.REACT_APP_PERMIT_KEY))) {
            // Checa para tokens não-validos.
            res.status(400).json({ status: 'Access denied' });
        }
    }

   
    next();
}

// Exporta função "auth"
module.exports = auth;