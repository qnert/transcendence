export function initializeLobby() {
    const roomName = JSON.parse(
        document.getElementById("room-name").textContent
    );
    console.log(`Lobby ${roomName} initialized`);

    const chatSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/lobby/" + roomName + "/"
    );

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        document.querySelector("#chat-log").value += data.message + "\n";
    };

    chatSocket.onclose = function (e) {
        console.error("Chat socket closed unexpectedly");
    };

    document.querySelector("#chat-message-input").focus();
    document.querySelector("#chat-message-input").onkeyup = function (e) {
        if (e.key === "Enter") {
            // enter, return
            document.querySelector("#chat-message-submit").click();
        }
    };

    document.querySelector("#chat-message-submit").onclick = function (e) {
        const messageInputDom = document.querySelector("#chat-message-input");
        const message = messageInputDom.value;
        chatSocket.send(
            JSON.stringify({
                message: message,
            })
        );
        messageInputDom.value = "";
    };
}
