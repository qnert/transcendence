// =========================== GLOBAL ===============================

let tournamentLobbySocket;

// =========================== MAIN EVENT LOOP ===============================

// TODO might remove
// TODO event listener either gobal or here if url changes
export async function tournamentLobbyEventLoop() {}
export async function tournamentLobbyInit(lobbyName, userName) {
  const tournamentLobbyChatLog = document.querySelector("#lobby-chat-log");
  const tournamentLobbyChatInput = document.querySelector("#lobby-chat-message-input");
  const tournamentLobbyChatSubmit = document.querySelector("#lobby-chat-message-submit");

  tournamentLobbySocket = new WebSocket(
    "ws://" + window.location.host + "/ws/tournament/lobby/" + lobbyName + "/" + userName + "/"
  );

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

  tournamentLobbySocket.onclose = function () {
    console.error("Chat socket closed unexpectedly");
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
  console.log("closing lobby socket");
  if (tournamentLobbySocket) {
    tournamentLobbySocket.close();
    tournamentLobbySocket = null;
  }
}
