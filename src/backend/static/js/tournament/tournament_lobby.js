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

    tournamentLobbySocket.onmessage = (event) => socketMessageHandler(event, tournamentLobbyChatLog);

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
        tournamentLobbySocket.send(
            JSON.stringify({
                status_change: true,
            })
        );
    };
}

// =========================== HELPERS ===============================

const socketMessageHandler = (event, tournamentLobbyChatLog) => {
    const data = JSON.parse(event.data);
    let message = "";

    if (data.message) {
        message = data.message;
    } else if (data.notification) {
        message = data.notification;
    }
    if (message) {
        updateChatLog(message, tournamentLobbyChatLog);
    } else if (data.participants) {
        updateParticipantsList(data.participants);
    } else if (data.game_settings_list) {
        updateGameSettingsList(data.game_settings_list);
    } else if (data.game_settings_editor) {
        renderGameSettingsEditor(data.game_settings_editor);
    } else if (data.advance_button) {
        renderAdvanceButton(data.advance_button);
    } else if (data.playing_content) {
        renderPlayingContent(data.playing_content);
    }

    /* note: in case this socket has become the host, some eventListeners have to be reattached */
    attachdynamicEventListeners();
};

const attachdynamicEventListeners = function () {
    const tournamentLobbySettingsForm = document.getElementById("lobby-game-settings-host-form");
    const tournamentLobbyAdvanceState = document.getElementById("lobby-advance-state-button");
    if (tournamentLobbyAdvanceState) {
        tournamentLobbyAdvanceState.onclick = function (event) {
            event.preventDefault();
            tournamentLobbySocket.send(
                JSON.stringify({
                    advanced_state: 'advance_state',
                })
            )
        };
    }
    if (tournamentLobbySettingsForm) {
        tournamentLobbySettingsForm.onsubmit = function (event) {
            event.preventDefault();
            const gameSettings = {
                ball_speed: document.getElementById("ballSpeed").value,
                max_score: document.getElementById("maxScore").value,
                background_color: document.getElementById("background").value,
                border_color: document.getElementById("borders").value,
                ball_color: document.getElementById("ballColor").value,
                advanced_mode: document.getElementById("advancedMode").checked,
                power_ups: document.getElementById("powerUps").checked,
            };
            tournamentLobbySocket.send(
                JSON.stringify({
                    game_settings_edited: gameSettings,
                })
            );
        };
    }
};

// =========================== Server Side Rendering ===============================

function updateChatLog(message, tournamentLobbyChatLog) {
    // put no newline on first message
    if (!tournamentLobbyChatLog.value) {
        tournamentLobbyChatLog.value += message;
    } else {
        tournamentLobbyChatLog.value += "\n" + message;
    }
    // scroll so new messages can be seen
    tournamentLobbyChatLog.scrollTop = tournamentLobbyChatLog.scrollHeight;
}

function updateParticipantsList(participantsHTML) {
    const participantsList = document.getElementById("lobby-participants-list").getElementsByTagName("tbody")[0];
    participantsList.innerHTML = participantsHTML;
}

function updateGameSettingsList(gameSettingsHTML) {
    const gameSettingsList = document.getElementById("lobby-game-settings-list").getElementsByTagName("tbody")[0];
    gameSettingsList.innerHTML = gameSettingsHTML;
}

function renderGameSettingsEditor(gameSettingsEditorHTML) {
    const gameInfoBox = document.getElementById("lobby-game-settings-editor-box");
    gameInfoBox.innerHTML = gameSettingsEditorHTML;
}

function renderAdvanceButton(advanceButtonHTML) {
    const advanceButtonBox = document.getElementById("lobby-advance-button-box");
    advanceButtonBox.innerHTML = advanceButtonHTML;
}

function renderPlayingContent(playingContent) {
    if (playingContent == 'remove'){
        const gameInfoBox = document.getElementById("lobby-game-info-box");
        gameInfoBox.innerHTML = "";
        const controlsBox = document.getElementById("lobby-controls-box");
        if (controlsBox){ controlsBox.remove(); }
        const footerBox = document.getElementById("lobby-footer-box");
        footerBox.style.display = "flex";
    }
    else {
        initTournamentMatch(playingContent);
    }
}

// =========================== CLEAN UP ===============================

export function tournamentLobbyCloseSocket() {
    if (tournamentLobbySocket) {
        tournamentLobbySocket.close();
        tournamentLobbySocket = null;
    }
}

// =========================== GAME / MATCH  ===============================

let chatSocket;
let context;

let board;
let boardWidth = 900;
let boardHeight = 500;

let playerWidth = 10;
let playerHeight = 100;
let playerHeight_power = playerHeight * 1.5;
let playerSpeedY = 0;
let playerSpeed_power;
let prevX = 0;
let prevY = 0;

let ballWidth = 10;
let ballHeight = 10;
let ballSpeed = 0;
let init_ballSpeed = 0;
let random = Math.random() > 0.5 ? 1 : -1;
let ballAngle = random * Math.PI / 4;
random = Math.random() > 0.5 ? 1 : -1;

let score1 = 0;
let score2 = 0;
let maxScore;
let rally = 0;
let rallies = [];

let advanced_mode;
let power_up_mode;
let size_power_up_used = false;
let speed_power_up_used = false;

let size_x = boardWidth/2;
let size_y = boardHeight/4;

let speed_x = boardWidth/2;
let speed_y = boardHeight/4 * 3;

let player1 = {
x: 10,
y: boardHeight / 2 - playerHeight/2,
width: playerWidth,
height: playerHeight,
curr_speedY: 0,
movespeed: 0
}

let player2 = {
x: boardWidth - playerWidth - 10,
y: boardHeight / 2 - playerHeight/2,
width: playerWidth,
height: playerHeight,
curr_speedY: 0,
movespeed: 0
}

let ball = {
x: boardWidth/2,
y: boardHeight/2,
width: ballWidth,
height: ballHeight,
speedX: random * ballSpeed * Math.cos(ballAngle),
speedY: ballSpeed * Math.sin(ballAngle)
}

let border_color;
let ball_color;
let background_color;

let id = 0;
let countdown = 6;
let intervalID = 0;
let items_pushed = 0;
let username;
let connected_users;


function initTournamentMatch(playingContent){
    const gameInfoBox = document.getElementById("lobby-game-info-box");
    gameInfoBox.innerHTML = playingContent.match_html;

    // playingContent
    //  game_settings
    //  username
    //  room_name
    //  match_html

    let room_name = playingContent.room_name;
    username = playingContent.username;
    chatSocket = new WebSocket(`ws://${window.location.host}/ws/game/${room_name}/${username}/`);

    const game_settings = playingContent.game_settings;

    ballSpeed = game_settings.ball_speed;
    ball.speedX = random * ballSpeed * Math.cos(ballAngle);
    ball.speedY = ballSpeed * Math.sin(ballAngle);

    border_color = game_settings.border_color;
    ball_color = game_settings.ball_color;
    background_color = game_settings.background_color;
    maxScore = game_settings.max_score;
    advanced_mode = game_settings.advanced_mode;
    power_up_mode = game_settings.power_ups;

    console.log(ballSpeed);
    console.log(ball.speedX);
    console.log(ball.speedY);
    console.log(border_color);
    console.log(ball_color);
    console.log(background_color);
    console.log(maxScore);
    console.log(advanced_mode);
    console.log(power_up_mode);

    chatSocket.onopen = function (event) {
        console.log("Tournament Match WebSocket opened!");
        console.log(chatSocket);
    }
}
