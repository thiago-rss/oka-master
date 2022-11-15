<p align="center">
    <img src="readme-demo/readme-demo-brand.png" width="50%">
</p>
<br />



## Rodando Localmente

#### 1 - Instalação
Para clonar e instalar os pacotes de frontend & backend:
```
$ git clone https://github.com/PtJung/Clique.git
$ cd Oka
$ npm i
$ cd lib
$ npm i
```

#### 2 - Perparação do ambiente
Crie um arquivo `.env` dentro do diretório `Oka` . Em seguida, preencha os seguintes valores para cada uma das chaves especificadas:
```
REACT_APP_ATLAS_URI - MongoDB connection URI
REACT_APP_PORT - Port to run the server on
REACT_APP_SESSION_LIFE - Life of an account session in seconds
REACT_APP_API_URL - Backend API url
REACT_APP_JWT_SECRET - Secret
REACT_APP_SESS_SECRET - Secret
REACT_APP_YT_SECRET - Secret
REACT_APP_PERMIT_KEY - Secret
```

#### 3 - Rodando
A partir do diretório `Oka`, execute os seguintes comandos:
```
$ node lib/server
$ npm start
```

## Construído com

* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Para guardar users e rooms na database
* [Express.js](https://expressjs.com/) - Executa a maior parte da logica do backend REST API
* [React](https://reactjs.org/) - Usado para criar a maior parte do frontend
* [Node.js](https://nodejs.org/) -  Runtime da aplicação
* [Socket.io](https://socket.io/) - Emula interaçõesm em tempo real entre os users
* [jQuery](https://jquery.com/) - Implementa uma versão clicavel do [DataTables](https://datatables.net/)
* [YouTube Data API](https://developers.google.com/youtube/v3) - Recebe os resultados da search bar
* [YouTube Player API](https://developers.google.com/youtube/iframe_api_reference) - Manipula o IFrame para reprodução de video em tempo real
