import { handle401Error, updateContentToken, handleRouteToken } from "../basics.js";
import { tournamentLobbyInit } from "./tournament_lobby.js";

// =========================== GLOBAL ===============================

const msgInvalidName = "Invalid tournament name!";
const msgInvalidOption = "Please select an existing Tournament!";
const msgInvalidLength = "Please enter a name smaller than 10 characters";

// =========================== MAIN EVENT LOOP ===============================

export function tournamentHubEventLoop() {
    const tournamentCreateButton = document.getElementById("tournamentCreateButton");
    if (tournamentCreateButton) {
        tournamentCreateButton.onclick = function (event) {
            event.preventDefault();
            createTournament();
        };
    }

    const tournamentRefreshLobbiesButton = document.getElementById("hub-refresh-lobbies-button");
    if (tournamentRefreshLobbiesButton) {
        tournamentRefreshLobbiesButton.onclick = async function (event) {
            event.preventDefault();
            refreshTournamentLobbyList();
        }
    }

    // Hint:
    // will attach all available Join Buttons
    attachDynamicEventListeners();
}

// =========================== EVENT FUNCTIONS ===============================

async function createTournament() {
    // Hint:
    // Input parsing for valid characters
    // (a-z A-Z .- 0-9, maximum 50 chars, at least one letter)
    const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9.-]{1,50}$/;
    const tournamentName = document.getElementById("tournament-form-name-field").value;
    if (tournamentName.length > 10){
        alert(msgInvalidLength);
        return;
    }
    if (!regex.test(tournamentName)) {
        alert(msgInvalidName);
        return;
    }
    try {
        await postTournament(tournamentName);
        await enterTournamentLobby(tournamentName);
    } catch (error) {
        alert(error);
    }
}

async function enterTournamentLobby(tournamentName) {
    const pathToLobby = "/tournament/lobby/" + tournamentName + "/";
    const userName = getUserNameFromDOM();
    const response = await updateContentToken(pathToLobby);
    if (response) {
        tournamentLobbyInit(tournamentName, userName);
    }
    else {
        refreshTournamentLobbyList();
    }
}

function getUserNameFromDOM() {
    const navbarDropdownMenuLink = document.getElementById("navbarDropdownMenuLink");
    return navbarDropdownMenuLink.innerHTML.trim();
}

async function refreshTournamentLobbyList() {
    const tournamentLobbyListTable = document.getElementById("hub-tournament-list-table");
    const tbody = tournamentLobbyListTable.querySelector('tbody');
    tbody.innerHTML = await getTournamentList();
    attachDynamicEventListeners();
}

async function attachDynamicEventListeners() {
    const buttons = document.querySelectorAll('[id^="hub-join-"][id$="-button"]');
    buttons.forEach(button => {
        button.onclick = function(event) {
            event.preventDefault();
            const tournamentName = this.id.replace('hub-join-', '').replace('-button', '');
            enterTournamentLobby(tournamentName);
        };
    });
}

// =========================== API REQUESTS ===============================

async function postTournament(tournamentName) {
    const token = localStorage.getItem("access_token");
    const response = await fetch("/tournament/api/create/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tournament_name: tournamentName }),
    });
    if (!response.ok) {
        if (response.status === 405 || response.status === 401) {
            handle401Error();
            return;
        }
        const responseError = await response.json();
        throw new Error(responseError.error);
    }
}

async function getTournamentList() {
    const token = localStorage.getItem("access_token");
    const tournamentList = await fetch("/tournament/api/get_list/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    if (!tournamentList.ok) {
        if (tournamentList.status === 401) {
            handle401Error();
            return;
        }
    }
    const html = await tournamentList.text();
    return html;
}
