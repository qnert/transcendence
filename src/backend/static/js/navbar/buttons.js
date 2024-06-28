import { handleRoute, handleRouteToken } from "../basics.js";
import { getLoginStatus } from "../basics.js";

export function soloGame() {
    const soloGameButton = document.getElementById("game");
    if (soloGameButton) {
        soloGameButton.onclick = function (event) {
            event.preventDefault();
            handleRouteToken("/game/");
        };
    }
}

export function multiplayerGame() {
    const multiplayerGame = document.getElementById("multiplayerGame");
    if (multiplayerGame) {
        multiplayerGame.onclick = function (event) {
            event.preventDefault();
            handleRouteToken("/multiplayer/");
        };
    }
}

export function loginButton() {
    const loginButton = document.getElementById("login");
    if (loginButton) {
        loginButton.onclick = function (event) {
            event.preventDefault();
			handleRoute("/login/");
        };
    }
}

export function tournamentButton() {
    const tournamentButton = document.getElementById("tournamentButton");
    if (tournamentButton) {
        tournamentButton.onclick = function (event) {
            event.preventDefault();
			handleRouteToken("/tournament/hub/");
        };
    }
}

export function defaultButton() {
    const defaultButton = document.getElementById("defaultButton");
    if (defaultButton) {
        defaultButton.onclick = function (event) {
            event.preventDefault();
            window.history.pushState({ path: "/" }, "", "/");
            const oldContent = document.getElementById("oldContent");
            if (oldContent) {
                oldContent.innerHTML = "";
            }
        };
    }
}


export async function homeButton() {
    const homeButton = document.getElementById("homeButton");
    if (homeButton) {
        homeButton.onclick = async function (event) {
            event.preventDefault();
			if(await getLoginStatus())
            	await handleRouteToken("/home/");
			else{
				await handleRoute("/login/");
			}
        };
    }
}
