import { initTournamentLobbyEventLoop } from "./tournament_lobby.js";
import { handleRoute, updateContentToken, updateContent } from "../basics.js";

console.log("< tournament_hub.js > loaded successfully");

const msgInvalidName = "Invalid tournament name!";
const msgInvalidOption = "Please select an existing Tournament!";

export function initTournamentHubEventLoop() {
  const tournementCreateButton = document.getElementById(
    "tournamentCreateButton"
  );
  if (tournementCreateButton) {
    document
      .getElementById("tournamentCreateButton")
      .addEventListener("click", function (event) {
        event.preventDefault();
        createTournament();
      });
  }
  const tournamentJoinButton = document.getElementById("tournamentJoinButton");
  if (tournamentJoinButton) {
    document
      .getElementById("tournamentJoinButton")
      .addEventListener("click", function (event) {
        event.preventDefault();
        joinTournament();
      });
  }

  const tournamentBackButton = document.getElementById("tournamentBackButton");
  if (tournamentBackButton) {
    document
      .getElementById("tournamentBackButton")
      .addEventListener("click", function (event) {
        event.preventDefault();
        getBack();
      });
  }

  const dropdownMenu = document.getElementById("join-field-list");
  if (dropdownMenu) {
    dropdownMenu.addEventListener("focus", function (event) {
      event.preventDefault();
      updateTournamentList(dropdownMenu);
    });
  }
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
  const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9.-]{1,50}$/;

  if (regex.test(tournamentName)) {
    postTournament(tournamentName);
  } else {
    alert(msgInvalidName);
    return;
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
  if (selectedOption && selectedOption.innerHTML) {
    const tournamentName = selectedOption.innerHTML;
    enterTournamentLobby(tournamentName);
    // TODO maybe use updateContentToken here and define pathname in this function before
  } else {
    alert(msgInvalidOption);
  }
}

async function enterTournamentLobby(tournamentName) {
  async function postParticipant(tournamentName) {
    const response = await fetch("/tournament/api/join/", {
      method: "POST",
      body: JSON.stringify({ tournament_name: tournamentName }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      console.log("User added");
    } else {
      const responseError = await response.json();
      alert(responseError.error);
    }
  }

  postParticipant(tournamentName);

  const pathname = "/tournament/lobby/" + tournamentName + "/";
  const tournamentLobby = await fetch(pathname, {
    method: "GET",
  });
  const html = await tournamentLobby.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const newContent = doc.querySelector("#newContent");
  const oldContent = document.getElementById("oldContent");
  oldContent.innerHTML = "";
  oldContent.appendChild(newContent);
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
