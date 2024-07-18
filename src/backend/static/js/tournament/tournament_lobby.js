import { create_tournament_match, close_multi_on_change } from "../game/multiplayer.js";
import { updateContentToken, handleRouteToken } from "../basics.js";
import { tournamentHubEventLoop } from "./tournament_hub.js";

// =========================== GLOBAL ===============================

let tournamentLobbySocket;

const msgRageQuit = "A kiddo decided to rage quit, the tournament has to end";
const msgTaunt = "You just got rekt...";
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
    const tournamentLobbyLeaveButton = document.getElementById("lobby-leave-button");

    tournamentLobbySocket = new WebSocket("wss://" + window.location.host + "/ws/tournament/lobby/" + lobbyName + "/" + userName + "/");

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

    tournamentLobbyLeaveButton.onclick = async function (event) {
        event.preventDefault();
        tournamentLobbyCloseSocket();
        setTimeout(async function () {
            await updateContentToken("/tournament/hub");
        }, 300);
        tournamentHubEventLoop();
    };
}

// =========================== HELPERS ===============================

async function socketMessageHandler(event, tournamentLobbyChatLog) {
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
    } else if (data.end_screen) {
        close_multi_on_change();
    }

    // Hint:
    // On MSG_LEAVE notification a data.disconnect is sent too,
    // indicating wether the Tournament will be closed (only during 'playing' phase),
    // in which case everyone has to leave/disconnect
    if (data.disconnect == true) {
        leaveTournament();
        return;
    }
    // Hint:
    // In case the host has changed, eventListeners must be reattached
    attachdynamicEventListeners();
}

const attachdynamicEventListeners = function () {
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

    const tournamentLobbySettingsForm = document.getElementById("lobby-game-settings-host-form");
    if (tournamentLobbySettingsForm) {
        tournamentLobbySettingsForm.onsubmit = function (event) {
            event.preventDefault();

            // Extract values
            const ballSpeed = document.getElementById("ballSpeed").value;
            const maxScore = document.getElementById("maxScore").value;

            // Validate inputs
            if (maxScore === "" || ballSpeed === "") {
                alert("Max Score and Ball Speed cannot be empty.");
                return;
            }

            const maxScoreInt = parseInt(maxScore);
            const ballSpeedInt = parseInt(ballSpeed);

            if (maxScoreInt > 12 || maxScoreInt <= 3) {
                alert("Max Score must be between 4 and 12.");
                return;
            }

            if (ballSpeedInt > 20 || ballSpeedInt <= 3) {
                alert("Ball Speed must be between 4 and 20.");
                return;
            }

            // Collect game settings
            const gameSettings = {
                ball_speed: ballSpeedInt.toString(),
                max_score: maxScoreInt.toString(),
                background_color: document.getElementById("background").value,
                border_color: document.getElementById("borders").value,
                ball_color: document.getElementById("ballColor").value,
                advanced_mode: document.getElementById("advancedMode").checked,
                power_ups: document.getElementById("powerUps").checked,
            };

            // Send settings to the backend
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
    const gameSettingsList = document.getElementById("lobby-game-settings-list");
    gameSettingsList.innerHTML = setupContent.game_settings_html;

    // Hint:
    // Only render if all participants are ready and current user is host
    if (setupContent.advance_button_html) {
        const advanceButtonBox = document.getElementById("lobby-advance-button-box");
        advanceButtonBox.innerHTML = setupContent.advance_button_html;
    } else {
        const advanceButtonBox = document.getElementById("lobby-advance-button-box");
        advanceButtonBox.innerHTML = "";
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
    gameInfoBox.insertAdjacentHTML("beforeend", playingContent.matches_list_html);
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
        };
    }
}

function renderFinishedContent(finishedContent) {
    const headerBox = document.getElementById("lobby-header-box");
    headerBox.innerHTML = finishedContent.winners_html;
    headerBox.insertAdjacentHTML("beforeend", finishedContent.finished_buttons_html);

    const gameInfoBox = document.getElementById("lobby-game-info-box");
    gameInfoBox.innerHTML = finishedContent.standings_html;
    gameInfoBox.insertAdjacentHTML("beforeend", finishedContent.matches_list_html);

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
    };

    const tournamentLobbyLeaveButton = document.getElementById("lobby-leave-button");
    tournamentLobbyLeaveButton.onclick = async function (event) {
        event.preventDefault();
        tournamentLobbyCloseSocket();
        setTimeout(async function () {
            await updateContentToken("/tournament/hub");
        }, 700);
        tournamentHubEventLoop();
    };
}

export async function leaveTournament() {
    alert(msgRageQuit);
    tournamentLobbyCloseSocket();
    setTimeout(async function () {
        await updateContentToken("/tournament/hub");
    }, 700);
    tournamentHubEventLoop();
}
