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

window.initTournamentHubEventLoop = initTournamentHubEventLoop;

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
    console.log("joined Tournament " + tournamentName);
    const newContent = document.getElementById("newContent");
    const pathname = "/tournament/lobby/" + tournamentName + "/";
    const tournamentList = await fetch(pathname, {
        method: "GET",
    });
    const html = await tournamentList.text();
    newContent.innerHTML = html;
    history.pushState({ tournamentName: tournamentName }, "", pathname);
    initTournamentLobbyEventLoop();
}

function getBack() {
    const newContent = document.getElementById("newContent");
    newContent.innerHTML = "";
    history.pushState({}, "", "/tournament/");
}

// // TODO make this a global object / array
// // sth usable like ...
// // ... alert(`${msg.tournament.InvalidName}`)
//const msgFormInfo = "Please enter a Tournament Name!"
//const msgInvalidName = "Invalid tournament name!"
//const msgFailedLoad = "Failed to load the Tournament Lobby!"
//const msgFetchError = "An error occured. Please try again later!"
//
//async function get_tournaments() {
// const fetchTournamentsURL = "/tournament/api/get_list"
// const fetchTournamentsResponse = await fetch(fetchTournamentsURL, {
// method: "GET",
//})
//
// const tournaments = await fetchTournamentsResponse
// console.log(tournaments)
// const tournamentListElement = document.getElementById("join-field-list")
// }
//
//document.addEventListener("DOMContentLoaded", function() {
// get_tournaments()
//    const form = document.getElementById("tournament-form")
//    const tournamentNameField= document.getElementById(
// "tournament-form-name-field"
//)
//
// form.addEventListener("submit", function(event) {
// event.preventDefault()
//        const tournamentName= tournamentNameField.value
// // @ note might change this to better UX
// if (!tournamentName) {
// alert(`${msgFormInfo}`)
//} else if (/^(?=.*[a-zA-Z])[a-zA-Z0-9_-] +$/.test(tournamentName)) {
// createTournament(tournamentName)
//} else {
// alert(`${msgInvalidName}`)
//}
//})
//
//    const joinGroup = document.getElementById("join-field-group")
// joinGroup.addEventListener("submit", function(event) {
// event.preventDefault()
//})
// });
//
//async function joinTournament(tournamentName) {
// const joinURL = `/tournament /${tournamentName}`
// const response = await fetch(lobbyURL, {
// method: "GET",
//})
// console.log(response)
// }
//
// // @ note abstract code a little
//async function createTournament(tournamentName) {
// const createURL = "/tournament/api/create/"
// try {
// const response = await fetch(createURL, {
// method: "POST",
// body: JSON.stringify({tournament_name: tournamentName}),
// headers: {
// "Content-Type": "application/json",
// },
//})
// if (response.ok) {
// // @ note do i even need the processedResponse?
// const processedResponse = await response.json()
//
// const lobbyURL = `/tournament /${tournamentName} /`
// const lobbyResponse = await fetch(lobbyURL, {
// method: "GET",
//})
//
// if (lobbyResponse.ok) {
// const lobbyHTML = await lobbyResponse.text()
// document.getElementById("newContent").innerHTML = lobbyHTML
// const newURL = `/tournament /${tournamentName} /`
// history.pushState({path: newURL}, "", newURL)
// window.initializeLobby()
// } else {
// alert(`${msgFailedLoad}`)
// }
//} else {
// errorResponse = await response.json()
// alert(errorResponse.error)
//}
// } catch (error) {
// alert(`${msgFetchError}`)
// }
// }
