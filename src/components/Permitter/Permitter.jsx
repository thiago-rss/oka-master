import React, { useEffect } from 'react';
import axios from 'axios';

function permitUser(props) {
    axios.post(process.env.REACT_APP_API_URL + "/api/users/permit")
        .then((res) => {
            axios.defaults.headers.common['api-auth-pass'] = res.data.token;
            props.setPermitted(true);
        });
}

function Permitter(props) {

    useEffect(() => {
        // Colocar o permitter em todas as páginas é conveniente para ajustar os headers , garantindo a segurança das requisições
        permitUser(props);
        setInterval(() => {
            // Espera que a duração da permissão seja maior que 1 segundo
            permitUser(props);
        }, 1000);
    }, [props]);

    return (<></>);
}

export default Permitter;