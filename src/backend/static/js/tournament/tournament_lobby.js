export async function initTournamentLobbyEventLoop() {

    const lobbyName = JSON.parse(
        document.getElementById("lobby_name").textContent
    );

    // TODO need to add routines to update both
    updateState(lobbyName);
    updateParticipants(lobbyName);

    const lobbySocket = new WebSocket(
        "ws://" +
            window.location.host +
            "/ws/tournament/lobby/" +
            lobbyName +
            "/"
    );

    lobbySocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        let message = "";
        console.log(data.username);
        console.log(data);
        if (data.username) {
            message = `${data.username}: ${data.message}`;
        } else {
            message = `${data.message}`;
        }
        document.querySelector("#lobby-chat-log").value += message + "\n";
    };

    lobbySocket.onclose = function (event) {
        console.error("Chat socket closed unexpectedly");
    };

    document.querySelector("#lobby-chat-message-input").focus();
    document.querySelector("#lobby-chat-message-input").onkeyup = function (
        event
    ) {
        if (event.key === "Enter") {
            document.querySelector("#lobby-chat-message-submit").click();
        }
    };

    document.querySelector("#lobby-chat-message-submit").onclick = function (
        event
    ) {
        const lobbyChatInput = document.querySelector(
            "#lobby-chat-message-input"
        );
        const message = lobbyChatInput.value;
        lobbySocket.send(
            JSON.stringify({
                message: message,
            })
        );
        lobbyChatInput.value = "";
    };
}

async function updateState(lobbyName) {
    const response = await fetch(
        `/tournament/api/get_state?tournament_name=${lobbyName}`,
        {
            method: "GET",
            tournament_name: lobbyName,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    const jsonData = await response.json();
    const lobbyState = jsonData.state;
    const lobbyStateHeader = document.getElementById("tournament-lobby-state");
    lobbyStateHeader.innerHTML = "Phase: " + lobbyState;
}

async function updateParticipants(lobbyName) {
    const response = await fetch(
        `/tournament/api/get_participants?tournament_name=${lobbyName}`,
        {
            method: "GET",
            tournament_name: lobbyName,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    const html = await response.text();
    const participantsList = document.getElementById("lobby-participants-list");
    participantsList.innerHTML = html;
}

function closeSocket(socket) {
    if (socket !== null) {
        socket.close();
        socket = null;
    }
}
