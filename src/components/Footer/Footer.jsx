import React from 'react';
import styles from './Footer.module.css';

function Footer() {

    return (
        <div className={styles.footer}>
            <div className={styles.termsContainer}>
                <div className={styles.termsWrapper}>
                    -&nbsp;
                    <a href="/terms" className={styles.termsAnchor}>
                        Termos de serviço
                    </a>
                    &nbsp;-
                </div>
            </div>
        </div>
    )
}

export default Footer;