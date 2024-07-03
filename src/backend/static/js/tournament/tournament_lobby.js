// =========================== GLOBAL ===============================

let tournamentLobbySocket;

// =========================== MAIN EVENT LOOP ===============================

export function tournamentLobbyInit(lobbyName, userName) {
    // this code is not run in reattachEventListener, so protection shouldnt be needed
    const tournamentLobbyChatLog = document.getElementById("lobby-chat-log");
    const tournamentLobbyChatInput = document.getElementById("lobby-chat-message-input");
    const tournamentLobbyChatSubmit = document.getElementById("lobby-chat-message-submit");
    const tournamentLobbyStatusToggler = document.getElementById("lobby-status-switch");
    const tournamentLobbySettingsForm = document.getElementById("lobby-game-settings-host-form")
    const tournamentLobbyAdvanceState = document.getElementById("lobby-advance-state-button");
    tournamentLobbySocket = new WebSocket("ws://" + window.location.host + "/ws/tournament/lobby/" + lobbyName + "/" + userName + "/");

    tournamentLobbySocket.onmessage = (event) => socketMessageHandler(event, tournamentLobbyChatLog);


    tournamentLobbyChatInput.focus();
    tournamentLobbyChatInput.onkeyup = function (event) {
        if (event.key === "Enter") {
            tournamentLobbyChatSubmit.click();
        }
    };

    tournamentLobbyChatSubmit.onclick = function () {
        const message = tournamentLobbyChatInput.value;
        if (message.trim() !== "") {
            tournamentLobbySocket.send(
                JSON.stringify({
                    message: message,
                })
            );
        }
        tournamentLobbyChatInput.value = "";
    };

    tournamentLobbyStatusToggler.onchange = function () {
        // TODO event prevent default?
        // TODO simplify
        if (tournamentLobbyStatusToggler.checked) {
            tournamentLobbySocket.send(JSON.stringify({
                status:true,
            }));
        }
        else {
            tournamentLobbySocket.send(JSON.stringify({
                status:false,
            }));
        }
    };

    if (tournamentLobbyAdvanceState){
        tournamentLobbyAdvanceState.onclick = function (event) {
            event.preventDefault();
            advanceState();
        }
    }
    if (tournamentLobbySettingsForm) {
        tournamentLobbySettingsForm.onsubmit = function (event) {
            event.preventDefault();

            // TODO simplify
            const ballSpeed = document.getElementById('ballSpeed').value;
            const maxScore = document.getElementById('maxScore').value;
            const backgroundColor = document.getElementById('background').value;
            const borderColor = document.getElementById('borders').value;
            const ballColor = document.getElementById('ballColor').value;
            const advancedMode = document.getElementById('advancedMode').checked;
            const powerUps = document.getElementById('powerUps').checked;

            const gameSettings = {
                "ball_speed": ballSpeed,
                "max_score": maxScore,
                "background_color": backgroundColor,
                "border_color": borderColor,
                "ball_color": ballColor,
                "advanced_mode": advancedMode,
                "power_ups": powerUps,
            }

            tournamentLobbySocket.send(JSON.stringify({
                "game_settings_edited": gameSettings,
            }));
        }
    }
}




// =========================== HELPERS ===============================

const socketMessageHandler = (event, tournamentLobbyChatLog) => {
        const data = JSON.parse(event.data);
        let message = "";
 
        if (data.message){ message = data.message; }
        else if (data.notification){ message = data.notification; }
        if (message) { updateChatLog(message, tournamentLobbyChatLog); }
        else if (data.participants) { updateParticipantsList(data.participants); }
        else if (data.game_settings_list) { updateGameSettingsList(data.game_settings_list); }
        else if (data.game_settings_editor) { renderGameSettingsEditor(data.game_settings_editor); }
        else if (data.advance_button) { renderAdvanceButton(data.advance_button); }
        attachLobbyEventListeners();
}

// =========================== Server Side Rendering ===============================

function updateChatLog(message, tournamentLobbyChatLog) {
    // put no newline on first message
    if (!tournamentLobbyChatLog.value) { tournamentLobbyChatLog.value += message; }
    else { tournamentLobbyChatLog.value += "\n" + message; }
    // scroll so new messages can be seen
    tournamentLobbyChatLog.scrollTop = tournamentLobbyChatLog.scrollHeight;
}

function updateParticipantsList(participantsHTML) {
    const participantsList = document.getElementById("lobby-participants-list").getElementsByTagName('tbody')[0];
    participantsList.innerHTML = participantsHTML;
}

function updateGameSettingsList(gameSettingsHTML) {
    const gameSettingsList = document.getElementById("lobby-game-settings-list").getElementsByTagName('tbody')[0];
    gameSettingsList.innerHTML = gameSettingsHTML;
}

function renderGameSettingsEditor(gameSettingsEditorHTML) {
    const gameInfoBox = document.getElementById("lobby-game-settings-editor-box");
    gameInfoBox.innerHTML = gameSettingsEditorHTML;
}

function renderAdvanceButton(advanceButtonHTML) {
    const controlsBox = document.getElementById("lobby-advance-button-box");
    controlsBox.innerHTML = advanceButtonHTML;
}

async function advanceState(){
    console.log("button pressed");
}

// =========================== CLEAN UP ===============================

export function tournamentLobbyCloseSocket() {
    if (tournamentLobbySocket) {
        tournamentLobbySocket.close();
        tournamentLobbySocket = null;
    }
}
