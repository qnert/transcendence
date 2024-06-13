function selectFriend(friendId, friendName) {
    const selectedFriendId = friendId;
    document.getElementById("friend-name").textContent = friendName;
    document.getElementById("chatRoom").style.display = "block";
    document.getElementById("friendsList").style.display = "none";
    document.getElementById("message").disabled = false;
    document.getElementById("send").disabled = false;
    loadMessages(friendId);
    initializeWebSocket(friendId);
}

function loadMessages(friendId) {
    fetch(`/api/messages/${friendId}/`)
        .then((response) => response.json())
        .then((data) => {
            const messageList = document.getElementById("chat-text");
            messageList.innerHTML = "";
            data.messages.forEach((message) => {
                messageList.value += `${message.sender}: ${message.content}\n`;
            });
        })
        .catch((error) => console.error("Error loading messages:", error));
}

function initializeWebSocket(friendId) {
    if (chatSocket) {
        chatSocket.close();
    }

    const userId = "{{ request.user.id }}"; // Correct Django template syntax
    chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${userId}/${friendId}/`);

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        const chatText = document.getElementById("chat-text");
        chatText.value += `${data.sender}: ${data.message}\n`;
    };

    chatSocket.onclose = function (e) {
        console.error("Chat socket closed");
    };
}

const send = document.getElementById("send");
if (send) send.onclick = sendMessage;

const message = document.getElementById("message");
if (message) {
    message.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
}

function sendMessage() {
    const messageInput = document.getElementById("message");
    const message = messageInput.value.trim();
    if (message && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(
            JSON.stringify({
                message: message,
                friend_id: selectedFriendId,
            })
        );
        messageInput.value = "";
    }
}

const leave = document.getElementById("leave");
if (leave) {
    leave.onclick = function () {
        if (chatSocket) {
            chatSocket.close();
        }
        document.getElementById("chatRoom").style.display = "none";
        document.getElementById("friendsList").style.display = "block";
        document.getElementById("message").disabled = true;
        document.getElementById("send").disabled = true;
        document.getElementById("chat-text").value = "";
        document.getElementById("message").value = "";
    };
}
