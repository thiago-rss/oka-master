/**
* Pequeno script de styling, roda no inicio da application.
*/

const resWidth = window.screen.width * window.devicePixelRatio;
const newWidth = parseInt(0.40 * resWidth) + "px";
const containers = ['navbarContainer', 'widboxContainer', 'aboutboxContainer', 'termsboxContainer'];

(function() {

    // Esse bloco ajusta as larguras dos containers no final do carregamento
    // a largura do container deve ser proporcional e constante em referência à
    // largura do dispositivo, porém o CSS não suporta constantes, então utilizamos o seguinte:
    containers.forEach(function (container) {
        const config = { attributes: true, childList: true, subtree: true };
        const callback = function (mutations, observer) {
            let existingContainer = document.getElementById(container);
            if (existingContainer) {
                existingContainer.style.width = newWidth;
                observer.disconnect();
                return;
            }
        }
        let observer = new MutationObserver(callback).observe(document, config);
    });

}());

