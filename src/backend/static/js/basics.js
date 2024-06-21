import { searchFriends } from "./friends/action_friends.js";
import { generateQRCode, validateOTP, handleCheckbox, checkBox } from "./profile/2FA.js";
import { bindProfileButton} from "./profile/buttons.js";
import { bindSaveChangesButton } from "./profile/buttons.js";
import { checkAccessToken, setNewPasswd } from "./profile/profile.js";
import { loginButton, homeButton, soloGame, multiplayerGame, defaultButton } from "./navbar/buttons.js";
import { login, logout, oauth, setPasswd } from "./navbar/logging.js";
import { checkLoginStatus } from "./login_check.js";
import { startGameButton, resetGameButton } from "./game/game.js";
import { createGameButton, startRemoteGame, resetRemoteGameButton } from "./game/multiplayer.js";
import { loadFriends } from "./friends/fetch_friends.js";
import { fetchProfileData } from "./profile/fetch_profile.js";

window.addEventListener("popstate", function (event) {
    if (event.state && event.state.path) {
		if(event.state.path === "/login/"){
			if(getLoginStatus){
				updateContentToken("/home/");
			}
			else{
				updateContent("/login/");
			}
		}
		else{
			updateContent(event.state.path);
		}
    }
});

document.addEventListener("DOMContentLoaded", function () {
    reattachEventListeners();
});

export async function updateContentToken(path) {
    const token = localStorage.getItem("access_token");

    try {
        const response = await fetch(path, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                handle401Error();
                return;
            } else {
                throw new Error("Unexpected Error");
            }
        }

        const html = await response.text();
        if (!html) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector("#newContent");
        const oldContent = document.getElementById("oldContent");
        oldContent.innerHTML = "";
        oldContent.appendChild(newContent);
        reattachEventListeners();

    } catch (error) {
        console.error("Error fetching content:", error);
    }
}




export function updateContent(path) {
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

export async function handleRoute(event, path) {
    event.preventDefault();
    if (window.location.pathname !== path) {
        window.history.pushState({ path: path }, "", path);
        await updateContentToken(path);
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
	resetRemoteGameButton();
	startRemoteGame();
	bindProfileButton();
	bindSaveChangesButton();
	}
	
window.onload = function () {
    loadFriends();
};

export let chatSocket;
export let selectedFriendId = null;


export function getUsername() { //jwt token?
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


	export async function getLoginStatus() {
		try {
			const response = await fetch("/api/login_status", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
			if (response.ok) {
				const data = await response.json();
				return data.loginStatus;
			} else {
				if (response.status === 401) {
					return false;
				}
			}
		} catch (error) {
			console.error("Error in getLoginStatus:", error);
			return false;
		}
	}
	
	export function handle401Error() {
		if (getLoginStatus()) {
			logout();
		}
		window.history.pushState({ path: "/login/" }, "", "/login/");
		updateContent("/login/");
		checkAccessToken();
	}



	window.onload = async function loadFriendsPage(){
		let url = window.location.href
		if(url.includes("/friend/")){
			let words = url.split("/");
			let display_name = words[4];
			await fetchFriendsData(display_name);
		}
	}

	window.onload = async function () {
		const currentUrl = window.location.href;
		console.log(currentUrl);
		if (currentUrl.includes("/profile/")) {
			await fetchProfileData();
			await checkBox();
		}
	};