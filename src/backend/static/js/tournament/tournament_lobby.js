import { create_tournament_match } from '../game/multiplayer.js'
import { handleRouteToken } from '../basics.js'

// =========================== GLOBAL ===============================

let tournamentLobbySocket;

// TODO change message?
const msgRageQuit = "A motherfucking kiddo decided to rage quit, before the tournament ended";

// =========================== MAIN EVENT LOOP ===============================

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
    let message = "";

    if (data.message) {
        message = data.message;
    } else if (data.notification) {
        message = data.notification;
    }
    if (message) {
        renderChatLog(message, tournamentLobbyChatLog);
    } else if (data.participants) {
        renderParticipantsList(data.participants);
    } else if (data.game_settings_list) {
        renderGameSettingsList(data.game_settings_list);
    } else if (data.game_settings_editor) {
        renderGameSettingsEditor(data.game_settings_editor);
    } else if (data.advance_button) {
        renderAdvanceButton(data.advance_button);
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
        await handleRouteToken("/tournament/hub/");
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
    // put no newline on first message
    if (!tournamentLobbyChatLog.value) {
        tournamentLobbyChatLog.value += message;
    } else {
        tournamentLobbyChatLog.value += "\n" + message;
    }
    // scroll so new messages can be seen
    tournamentLobbyChatLog.scrollTop = tournamentLobbyChatLog.scrollHeight;
}

function renderParticipantsList(participantsHTML) {
    const participantsList = document.getElementById("lobby-participants-list").getElementsByTagName("tbody")[0];
    participantsList.innerHTML = participantsHTML;
}

function renderGameSettingsList(gameSettingsHTML) {
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

export function finishTournamentMatch() {
    setTimeout(() => {
        tournamentLobbySocket.send(
            JSON.stringify({
                finished_match: true,
            })
        );
    }, 500);
}

export function refreshTournamentPlayingLobby() {
    tournamentLobbySocket.send(
        JSON.stringify({
            back_to_lobby: true,
        })
    );
}

function renderFinishedContent(finishedContent) {
    const gameInfoBox = document.getElementById("lobby-game-info-box");
    gameInfoBox.innerHTML = finishedContent.standings_html;
    gameInfoBox.insertAdjacentHTML('beforeend', finishedContent.matches_list_html)
    // TODO winner statement
    // TODO press 'f' to pay respect button in chat
}

// =========================== CLEAN UP ===============================

// Hint:
// used in handleURLChange() for global socket cleanup
export function tournamentLobbyCloseSocket() {
    if (tournamentLobbySocket) {
        tournamentLobbySocket.close();
        tournamentLobbySocket = null;
    }
}

