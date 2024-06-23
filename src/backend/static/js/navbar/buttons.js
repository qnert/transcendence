import { handleRoute, updateContentToken, updateContent } from "../basics.js";

export function soloGame() {
    const soloGameButton = document.getElementById("game");
    if (soloGameButton) {
        soloGameButton.onclick = function (event) {
            event.preventDefault();
            handleRoute(event, "/game/");
        };
    }
}

export function multiplayerGame() {
    const multiplayerGame = document.getElementById("multiplayerGame");
    if (multiplayerGame) {
        multiplayerGame.onclick = function (event) {
            event.preventDefault();
            handleRoute(event, "/multiplayer/");
        };
    }
}

export function loginButton() {
    const loginButton = document.getElementById("login");
    if (loginButton) {
        loginButton.onclick = function (event) {
            event.preventDefault();
            window.history.pushState({ path: "/login/" }, "", "/login/");
			updateContent("/login/");
        };
    }
}

export function tournamentButton() {
    const tournamentButton = document.getElementById("tournamentButton");
    if (tournamentButton) {
        tournamentButton.onclick = function (event) {
            event.preventDefault();
            window.history.pushState({ path: "/tournament/hub/" }, "", "/tournament/hub/");
			updateContent("/tournament/hub/");
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

export function homeButton() {
    const homeButton = document.getElementById("homeButton");
    if (homeButton) {
        const newHomeButton = homeButton.cloneNode(true);
        homeButton.parentNode.replaceChild(newHomeButton, homeButton);
        newHomeButton.onclick = function (event) {
            event.preventDefault();
            window.history.pushState({ path: "/home/" }, "", "/home/");
            updateContentToken("/home/");
        };
    }
}
