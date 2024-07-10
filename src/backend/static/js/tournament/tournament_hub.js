import { updateContentToken, handleRouteToken } from "../basics.js";
import { tournamentLobbyInit } from "./tournament_lobby.js";

// =========================== GLOBAL ===============================

const msgInvalidName = "Invalid tournament name!";
const msgInvalidOption = "Please select an existing Tournament!";

// =========================== MAIN EVENT LOOP ===============================

export function tournamentHubEventLoop() {
    const tournamentCreateButton = document.getElementById("tournamentCreateButton");
    if (tournamentCreateButton) {
        tournamentCreateButton.onclick = function (event) {
            event.preventDefault();
            createTournament();
        };
    }

    const tournamentJoinButton = document.getElementById("tournamentJoinButton");
    if (tournamentJoinButton) {
        tournamentJoinButton.onclick = function (event) {
            event.preventDefault();
            joinTournament();
        };
    }

    const tournamentDropDown = document.getElementById("join-field-list");
    if (tournamentDropDown) {
        tournamentDropDown.onclick = async function (event) {
            event.preventDefault();
            await getTournamentList(tournamentDropDown);
        };
    }
}

// =========================== MAIN FUNCTIONS ===============================

async function createTournament() {
    // checks input for valid characters (a-z A-Z .- 0-9, maximum 50 chars, at least one letter)
    const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9.-]{1,50}$/;
    const tournamentName = document.getElementById("tournament-form-name-field").value;
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

async function joinTournament() {
    const tournamentDropDown = document.getElementById("join-field-list");
    const selectedOption = tournamentDropDown.options[tournamentDropDown.selectedIndex];
    if (!selectedOption || !selectedOption.innerHTML) {
        alert(msgInvalidOption);
        return;
    }
    const tournamentName = selectedOption.innerHTML;
    await enterTournamentLobby(tournamentName);
}

async function enterTournamentLobby(tournamentName) {
    const pathToLobby = "/tournament/lobby/" + tournamentName + "/";
    const userName = getUserNameFromDOM();
    const response = await updateContentToken(pathToLobby);
    if (response) {
        tournamentLobbyInit(tournamentName, userName);
    }
}

// =========================== API REQUESTS ===============================

// TODO add security
async function postTournament(tournamentName) {
    const response = await fetch("/tournament/api/create/", {
        method: "POST",
        body: JSON.stringify({ tournament_name: tournamentName }),
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const responseError = await response.json();
        throw new Error(responseError.error);
    }
}

// TODO add security
async function getTournamentList(tournamentDropDown) {
    const tournamentList = await fetch("/tournament/api/get_list/", {
        method: "GET",
    });
    const html = await tournamentList.text();
    tournamentDropDown.innerHTML = html;
}

function getUserNameFromDOM() {
    const navbarDropdownMenuLink = document.getElementById("navbarDropdownMenuLink");
    return navbarDropdownMenuLink.innerHTML.trim();
}
