import { initTournamentLobbyEventLoop } from "./tournament_lobby.js";

console.log("< tournament_hub.js > loaded successfully");

const msgInvalidName = "Invalid tournament name!";

function initTournamentHubEventLoop() {
    document.addEventListener("click", function (event) {
        event.preventDefault();
    });

    document
        .getElementById("tournamentCreateButton")
        .addEventListener("click", function () {
            createTournament();
        });

    document
        .getElementById("tournamentJoinButton")
        .addEventListener("click", function () {
            joinTournament();
        });

    document
        .getElementById("tournamentBackButton")
        .addEventListener("click", function () {
            getBack();
        });

    const dropdownMenu = document.getElementById("join-field-list");
    dropdownMenu.addEventListener("focus", function () {
        updateTournamentList(dropdownMenu);
    });
}

async function updateTournamentList(dropdownMenu) {
    const tournamentList = await fetch("/tournament/api/get_list/", {
        method: "GET",
    });
    const html = await tournamentList.text();
    dropdownMenu.innerHTML = html;
}

async function createTournament() {
    const tournamentName = document.getElementById(
        "tournament-form-name-field"
    ).value;
    const regex = /^[a-zA-Z0-9.-]{1,100}$/;

    if (regex.test(tournamentName)) {
        postTournament(tournamentName);
    } else {
        alert(`${msgInvalidName}`);
    }

    async function postTournament(tournamentName) {
        const response = await fetch("/tournament/api/create/", {
            method: "POST",
            body: JSON.stringify({ tournament_name: tournamentName }),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            enterTournamentLobby(tournamentName);
        } else {
            const responseError = await response.json();
            alert(responseError.error);
        }
    }
}

async function joinTournament() {
    const dropdownMenu = document.getElementById("join-field-list");
    const selectedOption = dropdownMenu.options[dropdownMenu.selectedIndex];
    if (selectedOption) {
        const tournamentName = selectedOption.innerHTML;
        enterTournamentLobby(tournamentName);
    }
}

async function enterTournamentLobby(tournamentName) {
    const newContent = document.getElementById("newContent");
    const pathname = "/tournament/lobby/" + tournamentName + "/";
    const tournamentLobby = await fetch(pathname, {
        method: "GET",
    });
    const html = await tournamentLobby.text();
    newContent.innerHTML = html;
    history.pushState({ tournamentName: tournamentName }, "", pathname);
    initTournamentLobbyEventLoop();
}

function getBack() {
    const newContent = document.getElementById("newContent");
    newContent.innerHTML = "";
    history.pushState({}, "", "/tournament/");
}

// @note mb export instead?
window.initTournamentHubEventLoop = initTournamentHubEventLoop;
