import { handleRoute, handleRouteToken } from "../basics.js";
import { getLoginStatus } from "../basics.js";
import { getUsername } from "../basics.js";
import { showLoggedInState } from "./navbar.js";
import { initFriendSocket } from "../friends/action_friends.js";
import { loadChatHTML } from "../chat/action_chat.js";
import { pendingFriendRequest } from "../friends/fetch_friends.js";
import { loadFriends } from "../friends/fetch_friends.js";
import { updateFriendDropdown } from "../friends/action_friends.js";

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

export async function loginButton() {
    const loginButton = document.getElementById("login");
    if (loginButton) {
        loginButton.onclick = async function (event) {
            event.preventDefault();
			handleRoute("/login/");
			if(await getLoginStatus() === true){
				handleRouteToken("/home/");
				const username = await getUsername();
				showLoggedInState(username);
				checkAccessToken();
					initFriendSocket();
					loadChatHTML();
					pendingFriendRequest();
					await loadFriends();
					await updateFriendDropdown();
			}
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
