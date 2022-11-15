import React, { useState, useEffect } from 'react';
import { Alert, Button, ButtonGroup, Toast } from 'react-bootstrap';
import CreateRoomButton from './CreateRoomButton/CreateRoomButton';
import JoinRoomModal from './JoinRoomModal/JoinRoomModal';
import styles from './TWidgetBox.module.css';
import utils from '../utils';
import cx from 'classnames';
import $ from 'jquery';
import 'datatables.net-responsive/js/dataTables.responsive';

/**
 * === Global Constants ===
 * ROW_EVENT_EXEC: Evento jQuery para executar a função row da DataTable
 * ALERT_LIFETIME: Duração de todos os alertas em milisegundos
 */
const ROW_EVENT_EXEC = "click";
const ALERT_LIFETIME = 5000;

/**
 * Essa função permite que o user organiza a razão das colunas na DataTable Rooms List
 * 
 * Computa a organização crescente na seguinte ordem:
 *     - Room Capacity (Máxima)
 *     - Room Capacity (Atual)
 *     - Rooms Cheias
 * 
 * @param {String} x A primeira razão, acima a segunda, formatada em "<current>/<max>" na contagem de users
 * @param {String} y A segunda razão, abaixo da primeira, formatada em "<current>/<max>" na contagem de users
 * @return {number} Integral que guarda a ordem computada
 */
function swapRatioElements(x, y) {

    // Analise de dados x, y data como arrays respectivas [current, max]
    const xAsArray = x.split('/').map(function (num) { 
        return parseInt(num, 10); 
    });
    const yAsArray = y.split('/').map(function (num) { 
            return parseInt(num, 10); 
    });

    // Ordem crescente
    if (xAsArray[0] === xAsArray[1]) {
        // Full Room (tested: x/x, para alguns 'x')
        return -1;
    }
    else if (yAsArray[0] === yAsArray[1]) {
        // Sala Cheia (tested: y/y, para alguns 'y')
        return 1;
    }
    else if (yAsArray[0] === xAsArray[0]) {
        // x, y possuem a mesma capacidade
        return yAsArray[1] > xAsArray[1] ? 1 : -1;
    }
    // x, y tem capacidades atuais diferentes
    return yAsArray[0] > xAsArray[0] ? 1 : -1;
}

/**
 * Essa função atualiza a DataTable de Rooms limpando-a, em seguida adiciona os conteúdos a partir de um novo GET
 * 
 * @param {boolean} isSuccessAlertOn Flag para alertar o website quando bem sucedido
 */
async function updateRoomTable(isSuccessAlertOn) {

    utils.getRoomsResponse().then(dataInJSON => {

        // Input Invalido: alerta user na UI
        if (dataInJSON === undefined) {
            $('#failedAPICallAlert').show();
            $('#successAPICallAlert').hide();
            setTimeout(() => {
                $('#failedAPICallAlert').hide();
            }, ALERT_LIFETIME);
            return;
        }
        else if (isSuccessAlertOn) {
            $('#successAPICallAlert').show();
            setTimeout(() => {
                $('#successAPICallAlert').hide();
            }, ALERT_LIFETIME);
        }
        $('#failedAPICallAlert').hide();

        // Full table reset + dessaciação se eventos forem colocados aqui
        let table = $('#roomTable').DataTable().clear();
        // $('#roomTable tbody').unbind(ROW_EVENT_EXEC);

        // Para cada linha na database,  adiciona à table
        Object.keys(dataInJSON).forEach(key => {
            let roomInJSON = dataInJSON[key];

            if (roomInJSON['users'] !== undefined) {
                // Event (table): append database row
                table.row.add([
                    roomInJSON['roomName'],
                    roomInJSON['roomHost'],
                    {'userCountCurr': roomInJSON['users'].length, 'userCountMax': roomInJSON['maxUsers']},
                    roomInJSON['roomPass'],
                    roomInJSON['roomCode']
                ]);
            }
            table.draw('false');
        });
    });
}

const SuccessAPICallAlert = () => {
    return (
        <Alert id="successAPICallAlert" variant="success" style={{display: 'none'}} onClose={() => $('#successAPICallAlert').hide()} dismissible>
            <p className={styles.unselectable}>
                Updated rooms have been successfully retrieved.
            </p>
        </Alert>
    )
}

const FailedAPICallAlert = () => {
    return (
        <Alert id="failedAPICallAlert" variant="danger" style={{display: 'none'}} onClose={() => $('#failedAPICallAlert').hide()} dismissible>
            <p className={styles.unselectable}>
                Failed to retrieve updated rooms via Clique API. Please try again later.
            </p>
        </Alert>
    )
}

function TWidgetBox(props) {
    const [showToast, setShowToast] = useState(true);
    const [rowData, setRowData] = useState(["", "", {userCountCurr: 0, userCountMax: 0}, "", ""]);
    const [sessData, setSessData] = useState({_id: "", username: "", email: "", exp: 0});

    const setupRows = async ($) => {

        // Da table com constrains de coluna específicos
        let table = $('#roomTable').DataTable({
            order: [],
            language: {
                emptyTable: " "
            },
            columnDefs: [{
                targets: [0, 1, 2],
                className: styles.unselectable
            }, {
                targets: 2,
                searchable: false,
                type: 'userratio',
                render: (data) => {
                    return `${data['userCountCurr']}/${data['userCountMax']}`;
                }
            }, {
                targets: 3,
                searchable: false,
                className: styles.lock,
                render: (data) => {
                    return (data === '') ? '' : '<img src="/lock.png" className={styles.unselectable} alt="Locked" draggable="false" onContextMenu={function (e) {e.preventDefault()}} />';
                }
            }]
        });


        $('#roomTable tbody').on(ROW_EVENT_EXEC, 'tr', (evt) => {
            let newRowData = table.row(evt.target).data();
            if (newRowData) {
                setRowData(newRowData);
                $('#joinRoomModal').modal('show');
            }
        });
        $('#roomTable tbody').css('cursor', 'pointer');

    }

    useEffect(() => {
        $(document).ready(() => {
            $.noConflict();
            
            if ( !$.fn.DataTable.isDataTable('#roomTable') ) {
                
               
                $.fn.dataTable.ext.oSort["userratio-asc"] = function (x, y) {
                    return -swapRatioElements(x, y);
                };
                $.fn.dataTable.ext.oSort["userratio-desc"] = function (x, y) {
                    return swapRatioElements(x, y);
                };

                setupRows($);
            }
        });
    }, []);

    useEffect(() => {
        if (props.userPermitted) {

       
            const setupModalPerms = async () => {
                let resSession = await utils.getSession();
                if (resSession && resSession.data) {
                    setSessData(resSession.data);
                }
                updateRoomTable(false);
            }
            setupModalPerms();
        }
    }, [props.userPermitted]);
    
    return (
        <>
            <div id="widboxContainer" className={styles.widboxContainer}>
                <JoinRoomModal rowData={rowData} sessData={sessData} />
                <div style={{height: '40px'}}>
                    <FailedAPICallAlert />
                    <SuccessAPICallAlert />
                </div>
                <div className={styles.separatorTop} />
                <span className={styles.widgetDivider}>
                    <h2 className={cx(styles.unselectable, styles.roomNameCaption)}>
                        Room List
                    </h2>
                    <div className={styles.captionSeparator} />
                    <ButtonGroup>
                        <Button variant="outline-dark" className={cx(styles.unselectable, styles.refreshButton)} id="tableRefreshButton" onClick={() => {
                            
                            updateRoomTable(true);

                            let pressedButton = document.getElementById('tableRefreshButton');
                            pressedButton.disabled = true;
                            window.setTimeout(() => { 
                                pressedButton.disabled = false;
                            }, ALERT_LIFETIME);
                        }}>
                            Refresh
                        </Button>
                        <CreateRoomButton />
                    </ButtonGroup>
                </span>
                <br />

                <table id="roomTable" className="hover order-column row-border" style={{width: '100%'}}>
                    <thead>
                        <tr style={{outline: 'none'}}>
                            <th style={{width: '45%'}} className={styles.columnHeader}>
                                Room Name
                            </th>
                            <th style={{width: '25%'}} className={styles.columnHeader}>
                                Host
                            </th>
                            <th style={{width: '15%'}} className={styles.columnHeader}>
                                Users
                            </th>
                            <th style={{width: '15%'}} className={styles.columnHeader}>
                                Password
                            </th>
                        </tr>
                    </thead>
                </table>
                <div className={styles.separatorBot} />
            </div>
            <Toast className={styles.rowsToast} onClose={() => setShowToast(false)} show={showToast} delay={10000} animation={false} autohide>
                <Toast.Header>
                    <strong className="mr-auto">Notice</strong>
                </Toast.Header>
                <Toast.Body>
                    If the rows ever act strangely, refresh the page!
                </Toast.Body>
            </Toast>
        </>

    )
}

export default TWidgetBox;