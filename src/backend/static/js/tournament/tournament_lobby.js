export function initTournamentLobbyEventLoop() {
    const lobbyName = JSON.parse(
        document.getElementById("lobby_name").textContent
    );

    const chatSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/tournament/lobby/" + lobbyName + "/"
    );

    chatSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        document.querySelector("#lobby-chat-log").value += data.message + "\n";
    };

    chatSocket.onclose = function (event) {
        console.error("Chat socket closed unexpectedly");
    };

    document.querySelector("#lobby-chat-message-input").focus();
    document.querySelector("#lobby-chat-message-input").onkeyup = function (event) {
        if (event.key === "Enter") {
            // enter, return
            document.querySelector("#lobby-chat-message-submit").click();
        }
    };

    document.querySelector("#lobby-chat-message-submit").onclick = function (event) {
        const messageInputDom = document.querySelector("#lobby-chat-message-input");
        const message = messageInputDom.value;
        chatSocket.send(
            JSON.stringify({
                message: message,
            })
        );
        messageInputDom.value = "";
    };
}
