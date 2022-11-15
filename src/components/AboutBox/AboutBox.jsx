import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import styles from './AboutBox.module.css';
import cx from 'classnames';

class AboutBox extends Component {
    render() {
        return (
            <nav>
                <div id="aboutboxContainer" className={styles.aboutboxContainer}>
                    <div className={styles.separatorTop}>
                        <img src="/brand_full.png" className={cx(styles.unselectable, styles.brand)} height="100" alt="Clique"
                        draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                    </div>
                    <div className={styles.separatorButtonTop}>  
                        <Button href="/rooms" variant="outline-dark" draggable="false" className={cx(styles.unselectable, styles.roomButton)}>
                            Assista agora
                        </Button>
                    </div>
                    <div>
                        <p style={{textAlign: 'justify'}}>
                            Aplicação de compartilhamento de vídeo inspirada no <b>Watch2Gether</b> para o desafio técnico da <b>E RURAL</b>. 
                        </p>
                        <br />
                        <p style={{textAlign: 'justify'}}>
                            Feito para rodar em todos os navegadores modernos. Backend em Node.js e Express.js, Frontend utiliza a biblioteca React library com Bootstrap. Mongoose interagindo com MongoDB Atlas para guardar sessões de sala, dados do usuário. interações em tempo real com os vídeos são feitas através do Socket.IO. Por último,
                            jQuery é utilizado para implementar as DataTables.
                        </p>
                        <br />
                        <div className={styles.logoSeries}>
                            <img src="/logo_mongodb.png" className={cx(styles.unselectable, styles.logo)}  alt="MongoDB" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                            <img src="/logo_expressjs.png" className={cx(styles.unselectable, styles.logo)}  alt="ExpressJS" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                            <img src="/logo_react.png" className={cx(styles.unselectable, styles.logo)}  alt="React" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                            <img src="/logo_nodejs.png" className={cx(styles.unselectable, styles.logo)}  alt="NodeJS" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />
                        </div>
                    </div>
                </div>
            </nav>
        )
    }
}

export default AboutBox;