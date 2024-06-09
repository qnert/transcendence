let chatSocket;
let selectedFriendId  = null;
let userId = null;

  getUsernameFromBackend()

  function getUsernameFromBackend() {
    return fetch('/api/get_user_id/')
      .then(response => response.json())
      .then(data => {
        userId = data.id;
      })
      .catch(error => {
        console.error('Error loading user ID:', error);
        throw error;
      });
  }

export function loadChatHTML() {
  const chatHTML = `
      <input type="checkbox" id="check">
      <label class="chat-btn" for="check">
          <i class="fa fa-commenting-o comment"></i>
          <i class="fa fa-close close"></i>
      </label>
      <div class="wrapper" id="friendsList">
          <div class="header">
              <h6>Message a Friend</h6>
          </div>
          <div class="chat-form">
              <ul class="friend-list" id="friendList">
                  <!-- Friend list items will be dynamically inserted here -->
              </ul>
          </div>
      </div>

      <div class="wrapper" id="chatRoom" style="display: none;">
          <div class="header">
              <h6 id="chat-header">Chat with <span id="friend-name"></span></h6>
          </div>
          <div class="chat-form">
              <textarea class="form-control" id="chat-text" rows="5" readonly></textarea>
              <input type="text" class="form-control chat-text" id="message" placeholder="Your Message">
              <button class="btn-chat btn-success btn-block" id="send">Send</button>
              <button class="btn-chat btn-success btn-block" id="leave">Back</button>
          </div>
      </div>
  `;
  document.getElementById('chat').innerHTML = chatHTML;
}

export function selectFriend(friendId, friendName) {
    const selectedFriendId = friendId;
    document.getElementById('friend-name').textContent = friendName;
    document.getElementById('chatRoom').style.display = 'block';
    document.getElementById('friendsList').style.display = 'none';
    document.getElementById('message').disabled = false;
    document.getElementById('send').disabled = false;
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

document.getElementById('send').onclick = sendMessage;
document.getElementById('message').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});


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

document.getElementById('leave').onclick = function() {
    if (chatSocket) {
      chatSocket.close();
    }
    document.getElementById('chatRoom').style.display = 'none';
    document.getElementById('friendsList').style.display = 'block';
    document.getElementById('message').disabled = true;
    document.getElementById('send').disabled = true;
    document.getElementById('chat-text').value = '';
    document.getElementById('message').value = '';
  };
