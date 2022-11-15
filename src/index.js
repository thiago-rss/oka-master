/**
 * Arquivo renderização do front-end.
 * 
 * @author: thiagorss (Thiago Rosa)
 * @requires react
 * @requires react-dom
 */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

// Export aplicação web completa
export default App;