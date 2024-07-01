// =========================== GLOBAL ===============================

let tournamentLobbySocket;

// =========================== MAIN EVENT LOOP ===============================

export function tournamentLobbyInit(lobbyName, userName) {
    // this code is not run in reattachEventListener, so protection shouldnt be needed
    const tournamentLobbyChatLog = document.getElementById("lobby-chat-log");
    const tournamentLobbyChatInput = document.getElementById("lobby-chat-message-input");
    const tournamentLobbyChatSubmit = document.getElementById("lobby-chat-message-submit");
    const tournamentLobbyStatusToggler = document.getElementById("lobby-status-switch");
    tournamentLobbySocket = new WebSocket("ws://" + window.location.host + "/ws/tournament/lobby/" + lobbyName + "/" + userName + "/");

    tournamentLobbySocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        // TODO get display_name aswell
        let message = "";
        if (data.username) {
            message = `${data.username}: ${data.message}`;
        } else if (data.message) {
            message = `${data.message}`;
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
}

// =========================== HELPERS ===============================

function updateParticipantsList(participants) {

    // TODO mb get the view instead?
    const participantsList = document.getElementById("lobby-participants-list").getElementsByTagName('tbody')[0];
    participantsList.innerHTML = '';

    participants.forEach((participant, index) => {
        // create row
        const row = document.createElement("tr");

        // create cell for participant
        const participantCell = document.createElement("td")
        if (index == 0){
            participantCell.textContent = participant.name + "👑"
        }
        else {
            participantCell.textContent = participant.name
        }

        // create cell for participant status
        const statusCell = document.createElement("td");
        if (participant.status){
            statusCell.textContent = '✅';
        }
        else{
            statusCell.textContent = '❌';
        }

        // append cells and row to table element
        row.appendChild(participantCell);
        row.appendChild(statusCell);
        participantsList.appendChild(row);
    });

}

// =========================== CLEAN UP ===============================

export function tournamentLobbyCloseSocket() {
    if (tournamentLobbySocket) {
        tournamentLobbySocket.close();
        tournamentLobbySocket = null;
    }
}
