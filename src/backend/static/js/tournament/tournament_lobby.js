export async function initTournamentLobbyEventLoop() {
    const lobbyName = JSON.parse(
        document.getElementById("lobby_name").textContent
    );

    const lobbyState = await getState(lobbyName);
    const lobbyStateHeader = document.getElementById("tournament-lobby-state");
    lobbyStateHeader.innerHTML = "Phase: " + lobbyState;

    const lobbySocket = new WebSocket(
        "ws://" +
            window.location.host +
            "/ws/tournament/lobby/" +
            lobbyName +
            "/"
    );

    lobbySocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        document.querySelector("#lobby-chat-log").value += data.message + "\n";
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

async function getState(lobbyName) {
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
    return jsonData.state;
}
