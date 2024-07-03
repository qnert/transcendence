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

    tournamentLobbySocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        let message = "";
        if (data.message){
            message = data.message;
        }
        else if (data.notification){
            message = data.notification;
        }

        // only put newline (before) if chat log is not empty
        // always scroll to the last message
        if (message){
            if (!tournamentLobbyChatLog.value){
                tournamentLobbyChatLog.value += message;
            }
            else{
                tournamentLobbyChatLog.value += "\n" + message;
            }
            tournamentLobbyChatLog.scrollTop = tournamentLobbyChatLog.scrollHeight;
        }

        if (data.participants) {
            updateParticipantsList(data.participants);
        }

        if (data.game_settings_list) {
            updateGameSettingsList(data.game_settings_list);
        }

        // TODO implement
        if (data.game_settings_editor) {
            console.log("got something");
        }
        if (data.advance_button) {
            console.log("received advance button");
        }

    };

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

async function updateParticipantsList(participants_html) {
    const participantsList = document.getElementById("lobby-participants-list").getElementsByTagName('tbody')[0];
    participantsList.innerHTML = participants_html;
}

async function updateGameSettingsList(game_settings_html) {
    const gameSettingsList = document.getElementById("lobby-game-settings-list").getElementsByTagName('tbody')[0];
    gameSettingsList.innerHTML = game_settings_html;
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
