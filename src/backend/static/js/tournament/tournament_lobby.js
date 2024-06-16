export function initTournamentLobbyEventLoop() {
    const lobbyName = JSON.parse(
        document.getElementById("lobby-name").textContent
    );
    console.log(`Lobby ${lobbyName} initialized`);

    console.log(window.location.host);
    const chatSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/tournament/lobby/" + lobbyName + "/"
    );

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        document.querySelector("#lobby-chat-log").value += data.message + "\n";
    };

    chatSocket.onclose = function (e) {
        console.error("Chat socket closed unexpectedly");
    };

    document.querySelector("#lobby-chat-message-input").focus();
    document.querySelector("#lobby-chat-message-input").onkeyup = function (e) {
        if (e.key === "Enter") {
            // enter, return
            document.querySelector("#lobby-chat-message-submit").click();
        }
    };

    document.querySelector("#lobby-chat-message-submit").onclick = function (e) {
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
