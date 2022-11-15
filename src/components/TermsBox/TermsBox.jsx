import React, { Component } from 'react';
import styles from './TermsBox.module.css';

class TermsBox extends Component {

    render() {
        return (
            <nav>
                <div id="termsboxContainer" className={styles.termsboxContainer}>
                    <div className={styles.separatorTop}>
                        Terms of Service
                    </div>
                    <div>
                        <p style={{textAlign: 'justify'}}>
                            Última atualização: 15 Nov, 2022
                            <br /><br />
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                            Mauris ullamcorper facilisis viverra. Donec tristique dapibus sagittis. 
                            Aliquam ornare, nisi tincidunt maximus ultricies, eros tellus tincidunt purus, 
                            in gravida metus elit sed lacus. Curabitur vitae nisl in justo gravida convallis non eget elit. 
                            Suspendisse non turpis ut nisl tristique vestibulum quis ac nisl. Integer in nulla tortor. Aenean venenatis, nulla eu egestas malesuada, 
                            nulla nunc placerat arcu, non malesuada ipsum nibh vel libero. Sed sagittis ultrices congue. Mauris vel tempus erat.
                            Aenean ut imperdiet enim, in malesuada lorem. Maecenas ante lectus, tincidunt vel turpis eu, tristique malesuada magna. 
                            Morbi ultrices ligula nec rhoncus pulvinar. Vivamus posuere, orci at gravida dignissim, quam nisi pulvinar urna, sit amet sodales magna dolor nec ipsum. 
                            Curabitur ac consectetur dui. Curabitur ipsum dui, venenatis non pharetra et, scelerisque nec orci.
                            <br /><br />
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                            Mauris ullamcorper facilisis viverra. Donec tristique dapibus sagittis. 
                            Aliquam ornare, nisi tincidunt maximus ultricies, eros tellus tincidunt purus, 
                            in gravida metus elit sed lacus.
                            <br /><br />
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                            Mauris ullamcorper facilisis viverra. Donec tristique dapibus sagittis. 
                            <br /><br />
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                            Mauris ullamcorper facilisis viverra. Donec tristique dapibus sagittis. 
                            Aliquam ornare, nisi tincidunt maximus ultricies, eros tellus tincidunt purus, 
                            in gravida metus elit sed lacus. Curabitur vitae nisl in justo gravida convallis non eget elit. 
                            Suspendisse non turpis ut nisl tristique vestibulum quis ac nisl. Integer in nulla tortor. Aenean venenatis, nulla eu egestas malesuada, 
                            nulla nunc placerat arcu, non malesuada ipsum nibh vel libero. Sed sagittis ultrices congue. Mauris vel tempus erat.
                            Aenean ut imperdiet enim, in malesuada lorem.
                        </p>
                    </div>
                </div>
            </nav>
        )
    }
}

export default TermsBox;