import { handleRoute } from "../basics.js";
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
  try {
    const response = await postParticipant(tournamentName);
  } catch (error) {
    alert(error);
    return;
  }
  const pathToLobby = "/tournament/lobby/" + tournamentName + "/";
  const userName = getUserNameFromDOM();
  await handleRoute(pathToLobby);
  await tournamentLobbyInit(tournamentName, userName);
}

// =========================== API REQUESTS ===============================

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

async function postParticipant(tournamentName) {
  const response = await fetch("/tournament/api/join/", {
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

async function getTournamentList(tournamentDropDown) {
  const tournamentList = await fetch("/tournament/api/get_list/", {
    method: "GET",
  });
  // TODO error handling or no?
  const html = await tournamentList.text();
  tournamentDropDown.innerHTML = html;
}

function getUserNameFromDOM(){
  const navbarDropdownMenuLink = document.getElementById("navbarDropdownMenuLink");
  return navbarDropdownMenuLink.innerHTML.trim();
}

// TODO implement?
//        if (!response.ok) {
			//if(response.status === 401){
			//	handle401Error();
			//	return;
			//}