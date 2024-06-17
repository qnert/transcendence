import { searchFriends } from "./friends/action_friends.js";
import { generateQRCode, validateOTP, handleCheckbox, checkBox } from "./profile/2FA.js";
import { bindProfileButton} from "./profile/buttons.js";
import { bindSaveChangesButton } from "./profile/buttons.js";
import { setNewPasswd } from "./profile/profile.js";
import { loginButton, homeButton, soloGame, multiplayerGame, defaultButton } from "./navbar/buttons.js";
import { login, logout, oauth, setPasswd } from "./navbar/logging.js";
import { checkLoginStatus } from "./login_check.js";
import { startGameButton, resetGameButton } from "./game/game.js";
import { createGameButton, startRemoteGame } from "./game/multiplayer.js";
import { loadFriends } from "./friends/fetch_friends.js";

window.addEventListener("popstate", function (event) {
	//differentiate between routes 
    if (event.state && event.state.path) {
        updateContent(event.state.path);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    reattachEventListeners();
});

export function updateContentToken(path) {
    const token = localStorage.getItem("access_token");
    fetch(path, {
		method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    })
        .then((response) => {
            if (!response.ok) {
				console.log("error1");
                if (response.status === 401) {
					console.log("error2");
                    handle401Error();
                } else {
                    throw new Error("Unexpected Error");
                }
            }
            return response.text();
        })
        .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const newContent = doc.querySelector("#newContent");
            const oldContent = document.getElementById("oldContent");
            oldContent.innerHTML = "";
            oldContent.appendChild(newContent);
            reattachEventListeners();
        })
        .catch((error) => console.error("Error fetching content:", error));
}



export function updateContent(path) {
    const token = localStorage.getItem("access_token");
    fetch(path, {
		method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Unexpected Error");
            }
            return response.text();
        })
        .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const newContent = doc.querySelector("#newContent");
            const oldContent = document.getElementById("oldContent");
            oldContent.innerHTML = "";
            oldContent.appendChild(newContent);
            reattachEventListeners();
        })
        .catch((error) => console.error("Error fetching content:", error));
}

export function handleRoute(event, path) {
    event.preventDefault();
    if (window.location.pathname !== path) {
        window.history.pushState({ path: path }, "", path);
        updateContentToken(path);
    }
}

export function reattachEventListeners() {
    loginButton();
    login();
    logout();
    generateQRCode();
    validateOTP();
    oauth();
    homeButton();
    defaultButton();
    bindProfileButton();
	bindSaveChangesButton();
    soloGame();
    multiplayerGame();
    handleCheckbox();
    checkBox();
    setNewPasswd();
    searchFriends();
    checkLoginStatus();
    searchFriends();
    startGameButton();
    resetGameButton();
    setPasswd();
    createGameButton();
    startRemoteGame();
}

window.onload = function () {
    loadFriends();
};

export let chatSocket;
export let selectedFriendId = null;


export function getUsername() {
        fetch("/api/get_username", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const username = response.username;
            return username;
        } else {
            throw new Error("Failed to get username from backend");
        }
    }


export function getLoginStatus(){
	fetch("/api/login_status", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	if (response.ok) {
		const loginStatus = response.loginStatus;
		return loginStatus;
	} else {
		throw new Error("Failed to get username from backend");
	}
}


export function handle401Error(){
	if(getLoginStatus === true){
		logout();
		window.history.pushState({ path: "/login/" }, "", "/login/");
		updateContent("/login/");
	}
	else{
		window.history.pushState({ path: "/login/" }, "", "/login/");
		updateContent("/login/");
	}
}

