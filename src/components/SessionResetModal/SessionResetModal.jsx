import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import styles from './SessionResetModal.module.css';
import utils from '../utils';
import $ from 'jquery';
import axios from 'axios';

function renewSession(email) {
    return axios.post(process.env.REACT_APP_API_URL + "/api/users/auth/obtain", {
            "email": email,
            "ignorePass": true
        })
        .then(res => {
            return res.data;
        })
        .catch(err => {
            // console.log("Failed (/users/auth): " + err);
        });
}

function SessionResetModal() {
    const [show, setShow] = useState(false);
    const [sessEmail, setSessEmail] = useState("");

    useEffect(() => {
        async function deriveSessionEmail() {
            let resSession = await utils.getSession();
            if (resSession && resSession.data) {

                // Garante a configuração dos non-default
                if (resSession.data.email) {
                    setSessEmail(resSession.data.email);
                    renewSession(resSession.data.email);
                }
                if (resSession.data.exp) {
                    // Definite um timer para cada novo redirect, até que a sessão expire
                    let sessTimer = setTimeout(() => {
                        // Limpa todos os modais atuais para obeter um novo modal
                        let modalElems = document.querySelectorAll(".modal");
                        for (let modalElem of modalElems) {
                            modalElem.parentNode.removeChild(modalElem);
                        }
                        let modalBackdropElems = document.querySelectorAll(".modal-backdrop.show");
                        for (let modalBackdropElem of modalBackdropElems) {
                            modalBackdropElem.parentNode.removeChild(modalBackdropElem);
                        }
                        setShow(true);

                        // Eventos de intervalo (Inclui capacidade dos desenvolvedores de deletar o backdrop manualmente)
                        setInterval(() => {
                            let modalBackdropElem = document.querySelector(".modal-backdrop");
                            if (!modalBackdropElem || modalBackdropElem.style.display || ($(modalBackdropElem).css('visibility') === 'hidden')) {
                                window.location.reload();
                            }
                        }, 100);
                        clearInterval(sessTimer);
                    }, process.env.REACT_APP_SESSION_LIFE * 1000);
                }
            }
        }
        deriveSessionEmail();
    }, [show]);

    return (
        <Modal id="sessionResetModal" show={show} onHide={() => setShow(false)} animation={false} keyboard={false} backdrop="static" centered>
            <Modal.Header>
                <Modal.Title>
                    Session Expired
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Your session has expired due to inactivity.
                <br /><br />
                Press OK to re-establish your session.
            </Modal.Body>
            <Modal.Footer>
                <Button id="renewalButton" className={styles.renewalButton} variant="primary" onClick={() => {
                    renewSession(sessEmail);
                    window.location.reload();
                }}>
                    OK
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default SessionResetModal;