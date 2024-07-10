import { create_tournament_match } from '../game/multiplayer.js'
import { handleRouteToken } from '../basics.js'

// =========================== GLOBAL ===============================

let tournamentLobbySocket;

const msgRageQuit = "A kiddo decided to rage quit, the tournament has to end";
const msgTaunt = "You just got served...";
const msgRespect = "f";

// =========================== EXPORTS ===============================

// Hint:
// used in multiplayer.js
export function finishTournamentMatch() {
    setTimeout(() => {
        tournamentLobbySocket.send(
            JSON.stringify({
                finished_match: true,
            })
        );
    }, 500);
}

// Hint:
// used in multiplayer.js
export function refreshTournamentPlayingLobby() {
    tournamentLobbySocket.send(
        JSON.stringify({
            back_to_lobby: true,
        })
    );
}

// Hint:
// used in handleURLChange() for global socket cleanup
export function tournamentLobbyCloseSocket() {
    if (tournamentLobbySocket) {
        tournamentLobbySocket.close();
        tournamentLobbySocket = null;
    }
}

// Hint:
// used in tournament_hub.js
export function tournamentLobbyInit(lobbyName, userName) {
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

async function socketMessageHandler (event, tournamentLobbyChatLog) {
    const data = JSON.parse(event.data);

    // Hint:
    // messages and notifications are handled differently in backend
    let message = "";
    if (data.message) {
        message = data.message;
    } else if (data.notification) {
        message = data.notification;
    }

    if (message) {
        renderChatLog(message, tournamentLobbyChatLog);
    } else if (data.setup_content) {
        renderSetupContent(data.setup_content);
    } else if (data.playing_content) {
        renderPlayingContent(data.playing_content);
    } else if (data.finished_content) {
        renderFinishedContent(data.finished_content);
    }

    // Hint:
    // On MSG_LEAVE notification a data.disconnect is sent too,
    // indicating wether the Tournament will be closed (only during 'playing' phase),
    // in which case everyone has to leave/disconnect
    if (data.disconnect == true) {
        alert(msgRageQuit);
        await handleRouteToken("/tournament/");
        return;
    }
    // Hint:
    // In case the host has changed, eventListeners must be reattached
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
                    advanced_state: true,
                })
            );
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

function renderChatLog(message, tournamentLobbyChatLog) {
    // Hint:
    // All messages receive a newline in front,
    // which makes handling auto scrolling to the bottom on new message easier
    if (!tournamentLobbyChatLog.value) {
        tournamentLobbyChatLog.value += message;
    } else {
        tournamentLobbyChatLog.value += "\n" + message;
    }
    tournamentLobbyChatLog.scrollTop = tournamentLobbyChatLog.scrollHeight;
}

function renderSetupContent(setupContent) {
    // Hint:
    // This should be rendered everytime
    const participantsList = document.getElementById("lobby-participants-list").getElementsByTagName("tbody")[0];
    participantsList.innerHTML = setupContent.participants_html;
    const gameSettingsList = document.getElementById("lobby-game-settings-list").getElementsByTagName("tbody")[0];
    gameSettingsList.innerHTML = setupContent.game_settings_list_html;

    // Hint:
    // Only render if current user is also host
    if (setupContent.game_settings_editor_html) {
        const gameInfoBox = document.getElementById("lobby-game-settings-editor-box");
        gameInfoBox.innerHTML = setupContent.game_settings_editor_html;
        // Hint:
        // Only render if all participants are ready and current user is host
        if (setupContent.advance_button_html) {
            const advanceButtonBox = document.getElementById("lobby-advance-button-box");
            advanceButtonBox.innerHTML = setupContent.advance_button_html;
        }
    }
}

function renderPlayingContent(playingContent) {
    if (playingContent == "remove") {
        const gameInfoBox = document.getElementById("lobby-game-info-box");
        gameInfoBox.innerHTML = "";
        const controlsBox = document.getElementById("lobby-controls-box");
        if (controlsBox) {
            controlsBox.remove();
        }
        const footerBox = document.getElementById("lobby-footer-box");
        footerBox.style.display = "flex";
    } else {
        renderTournamentLobbyPlayingPhase(playingContent);
    }
}

function renderTournamentLobbyPlayingPhase(playingContent) {
    const gameInfoBox = document.getElementById("lobby-game-info-box");
    gameInfoBox.innerHTML = playingContent.standings_html;
    gameInfoBox.insertAdjacentHTML('beforeend', playingContent.matches_list_html)
    tournamentLobbySocket.send(
        JSON.stringify({
            updated_match_list: true,
        })
    );
    const joinNextTournamentMatch = document.getElementById("lobby-join-match-button");
    if (joinNextTournamentMatch) {
        joinNextTournamentMatch.onclick = function (event) {
            event.preventDefault;
            gameInfoBox.innerHTML = playingContent.match_html;
            create_tournament_match(playingContent);
            tournamentLobbySocket.send(
                JSON.stringify({
                    waiting_for_opponent: true,
                })
            );
        }
    }
}

function renderFinishedContent(finishedContent) {
    const headerBox = document.getElementById("lobby-header-box");
    headerBox.innerHTML = finishedContent.winners_html;
    headerBox.insertAdjacentHTML('beforeend', finishedContent.respect_button_html)

    const gameInfoBox = document.getElementById("lobby-game-info-box");
    gameInfoBox.innerHTML = finishedContent.standings_html;
    gameInfoBox.insertAdjacentHTML('beforeend', finishedContent.matches_list_html)

    const respectButton = document.getElementById("lobby-respect-button");
    respectButton.onclick = function (event) {
        event.preventDefault;
        let msgToSend = msgRespect;
        if (finishedContent.is_winner) {
            msgToSend = msgTaunt;
        }
        tournamentLobbySocket.send(
            JSON.stringify({
                message: msgToSend,
            })
        );
    }
}
