// =========================== GLOBAL ===============================

let tournamentLobbySocket;

// =========================== MAIN EVENT LOOP ===============================

export function tournamentLobbyInit(lobbyName, userName) {
    // this code is not run in reattachEventListener, so protection shouldnt be needed
    const tournamentLobbyChatLog = document.getElementById("lobby-chat-log");
    const tournamentLobbyChatInput = document.getElementById("lobby-chat-message-input");
    const tournamentLobbyChatSubmit = document.getElementById("lobby-chat-message-submit");
    tournamentLobbySocket = new WebSocket("ws://" + window.location.host + "/ws/tournament/lobby/" + lobbyName + "/" + userName + "/");

    tournamentLobbySocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        let message = "";
        if (data.username) {
            message = `${data.username}: ${data.message}`;
        } else {
            message = `${data.message}`;
        }
        tournamentLobbyChatLog.value += message + "\n";
    };

    tournamentLobbyChatInput.focus();
    tournamentLobbyChatInput.onkeyup = function (event) {
        if (event.key === "Enter") {
            tournamentLobbyChatSubmit.click();
        }
    };

    tournamentLobbyChatSubmit.onclick = function () {
        const message = tournamentLobbyChatInput.value;
        tournamentLobbySocket.send(
            JSON.stringify({
                message: message,
            })
        );
        tournamentLobbyChatInput.value = "";
    };
}

// =========================== CLEAN UP ===============================

export function tournamentLobbyCloseSocket() {
    if (tournamentLobbySocket) {
        console.log("[DEBUG] closing tournamentLobbySocket");
        tournamentLobbySocket.close();
        tournamentLobbySocket = null;
    }
}
