import { searchFriends, updateFriendDropdown } from "./friends/action_friends.js";
import { generateQRCode, validateOTPButton, handleCheckbox, checkBox } from "./profile/2FA.js";
import { bindProfileButton } from "./profile/buttons.js";
import { bindSaveChangesButton } from "./profile/buttons.js";
import { checkAccessToken, setNewPasswdButton } from "./profile/profile.js";
import { loginButton, homeButton, soloGame, multiplayerGame, defaultButton, tournamentButton } from "./navbar/buttons.js";
import { login, logoutButton, oauth, setPasswd, logout } from "./navbar/logging.js";
import { checkLoginStatus } from "./login_check.js";
import { startGameButton, resetGameButton, close_solo_on_change } from "./game/game.js";
import { loadFriends } from "./friends/fetch_friends.js";
import { fetchProfileData } from "./profile/fetch_profile.js";
import { createGameButton, startRemoteGame, resetRemoteGameButton, close_multi_on_change } from "./game/multiplayer.js";
import { matchHistoryButton, getGameHistory, pieChartButton, lineChartAvgButton, lineChartMaxButton, lineChartMinButton, hideAdvancedStatsButton } from "./profile/buttons.js";
import { showLoggedInState, showLoggedOutState } from "./navbar/navbar.js";
import { tournamentHubEventLoop} from "./tournament/tournament_hub.js";
import { tournamentLobbyCloseSocket } from "./tournament/tournament_lobby.js";
import { twoFAStatus } from "./profile/2FA.js";
import { jumpNextField } from "./profile/profile.js";
import { loadChatHTML } from "./chat/action_chat.js";
import { friendSocket, initFriendSocket} from "./friends/action_friends.js";
import { pendingFriendRequest } from "./friends/fetch_friends.js";
import { getUsernameFromBackend } from "./chat/action_chat.js";


document.addEventListener("DOMContentLoaded", function () {
    reattachEventListeners();
});

export function handleUrlChange() {
    close_multi_on_change();
    close_solo_on_change();
    tournamentLobbyCloseSocket();
}

const originalPushState = window.history.pushState;
window.history.pushState = function (state, title, url) {
	const currentUrl = window.location.href;
	if(currentUrl.includes("2FA") && (!twoFAStatus())){
		logout();
	}
    originalPushState.apply(window.history, arguments);
    handleUrlChange();
};

const originalReplaceState = window.history.replaceStateState;
window.history.replaceState = function (state, title, url) {
    originalPushState.apply(window.history, arguments);
    handleUrlChange();
};

window.addEventListener("popstate", async function (event) {
    if (event.state && event.state.path) {
		if(!(await getLoginStatus())){
			window.history.replaceState({ path: "/login/" }, "", "/login/");
			await updateContent("/login/");
		}
        else if (event.state.path === "/login/") {
			if (await getLoginStatus()) {
				window.history.replaceState({ path: "/home/" }, "", "/home/");
                await updateContentToken("/home/");
            } else {
                await updateContent("/login/");
				return;
            }
		}else if(event.state.path === "/2FA/"){
			if (await twoFAStatus()) {
				window.history.replaceState({ path: "/home/" }, "", "/home/");
				await updateContentToken("/home/");
			} else {
				await updateContent("/login/");
			}
		}else if(event.state.path.includes("tournament/lobby")){
			window.history.replaceState({ path: "/tournament/hub/" }, "", "/tournament/hub/");
			await updateContentToken("/tournament/hub/");
		} else if(event.state.path.includes("/friend/")){
			let currentUrl = window.location.href;
			let words = currentUrl.split("/");
			let display_name = words[4];
			await handleRouteToken(`/friend/${encodeURIComponent(display_name)}/`) //TODO does not load!!!
			console.log("HERE")
			await loadContentFriend(display_name);

		}else {
			// console.log(event.state.path)
			await updateContent(event.state.path);
        }
    }
    handleUrlChange();
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
                return false;
            }
            else if (response.status === 400) {
                const errorCode = await response.json();
                alert(errorCode.error);
                return false;
            }
            else {
                throw new Error("Unexpected Error");
            }
        }

        const html = await response.text();
        if (!html) return true;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newContent = doc.querySelector("#newContent");
        const oldContent = document.getElementById("oldContent");
        oldContent.innerHTML = "";
        oldContent.appendChild(newContent);
        reattachEventListeners();
    } catch (error) {
        console.error("Error fetching content:", error);
        handleRouteToken("/home/");
    }
    return true;
}

function updateContent(path) {
    fetch(path, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
				if (response.status === 401) {
					handle401Error();
					return;
				}
				else{
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
        .catch((error) => {
            console.error("Error fetching content:", error);
        });;
}

export async function handleRoute(path) {
    if (window.location.pathname !== path) {
        window.history.pushState({ path: path }, "", path);
        await updateContent(path);
    }
}

window.handleRouteToken = handleRouteToken;

export async function handleRouteToken(path) {
    if (window.location.pathname !== path) {
        window.history.pushState({ path: path }, "", path);
        await updateContentToken(path);
    }
}

export function reattachEventListeners() {
    bindProfileButton();
    getUsernameFromBackend();
    bindSaveChangesButton();
    checkBox();
    // checkLoginStatus();
    createGameButton();
    defaultButton();
    generateQRCode();
    handleCheckbox();
    hideAdvancedStatsButton();
    homeButton();
    lineChartAvgButton();
    lineChartMinButton();
    lineChartMaxButton();
    loginButton();
    login();
    logoutButton();
    matchHistoryButton();
    multiplayerGame();
    oauth();
    pieChartButton();
    resetGameButton();
    resetRemoteGameButton();
    setNewPasswdButton();
    setPasswd();
    searchFriends();
    soloGame();
    startGameButton();
    startRemoteGame();
	jumpNextField();

    tournamentButton();
    tournamentHubEventLoop();
    validateOTPButton();
}

export let chatSocket;
export let selectedFriendId = null;

export async function getUsername() {
    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch("/api/get_username", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
			if (response.status === 401 || response.status === 405){
				const errorData = await response.json
				console.error(errorData.error)
				handle401Error();
				return;
			}
        }

        const data = await response.json();
        const username = data.username;
        return username;
    } catch (error) {
        console.error("Error fetching username:", error);
        throw error;
    }
}

export async function handle401Error() {
    if (await getLoginStatus() === true) {
        await logout();
    }
    handleRoute("/login/");
    showLoggedOutState();
	handleUrlChange();
}

window.onload = async function () {
    handleUrlChange();
    let currentUrl = window.location.href;
    if (currentUrl.includes("/profile/")) {
        await fetchProfileData();
        await checkBox();
    } else if (currentUrl.includes("/friend/")) {
        let words = currentUrl.split("/");
        let display_name = words[4];
        await fetchFriendsData(display_name);
    } else if (!currentUrl.includes("/login/") || currentUrl !== "0.0.0.0:8000/") {
        await loadFriends();
		await updateFriendDropdown();
    } else if (currentUrl.includes("game")) {
        document.getElementById("background").value = "#ffffff"; // Default to white
        document.getElementById("borders").value = "#0000ff"; // Default to blue
        document.getElementById("ballColor").value = "#0000ff"; // Default to blue
    } else if (currentUrl.includes("multiplayer")) {
        document.getElementById("background").value = "#ffffff"; // Default to white
        document.getElementById("borders").value = "#0000ff"; // Default to blue
        document.getElementById("ballColor").value = "#0000ff"; // Default to blue
    } else if (currentUrl.includes("history")) {
        getGameHistory();
    }
    if (!currentUrl.includes("login") && currentUrl !== "http://0.0.0.0:8000/" && !currentUrl.includes("2FA") && !currentUrl.includes("set_passwd")) {
		const username = await getUsername();
        showLoggedInState(username);
		checkAccessToken();
		await loadFriends();
        await updateFriendDropdown();
		return;
    }
	else {
        showLoggedOutState();
    }
};

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
			else if(response.status === 400){
				return false;
			}
			else
				return false
        }
    } catch (error) {
        console.error("Error in getLoginStatus:", error);
        return false;
    }
}

window.handle401Error = handle401Error;

window.onload = async function () {
    let currentUrl = window.location.href;
    if (currentUrl.includes("/profile/")) {
        await fetchProfileData();
        await checkBox();
    }else if (currentUrl.includes("login")){
		if (await getLoginStatus() === true){
			handleRouteToken("/home/");
			const username = await getUsername();
			console.log(username)
        	showLoggedInState(username);
			checkAccessToken();
			if (!friendSocket) {
				initFriendSocket();
			}
				loadChatHTML();
				pendingFriendRequest();
				await loadFriends();
				await updateFriendDropdown();
			return;
		}
	}
	else if (currentUrl.includes("/friend/")) {
        let words = currentUrl.split("/");
        let display_name = words[4];
        await loadContentFriend(display_name);
    } else if (currentUrl.includes("game")) {
        document.getElementById("background").value = "#ffffff";
        document.getElementById("borders").value = "#0000ff";
        document.getElementById("ballColor").value = "#0000ff";
    } else if (currentUrl.includes("multiplayer")) {
        document.getElementById("background").value = "#ffffff";
        document.getElementById("borders").value = "#0000ff";
        document.getElementById("ballColor").value = "#0000ff";
    } else if (currentUrl.includes("history")) {
        await getGameHistory();
    }
    if (!currentUrl.includes("login") && currentUrl !== "http://0.0.0.0:8000/" && !currentUrl.includes("2FA") && !currentUrl.includes("set_passwd")) {
		const username = await getUsername();
        showLoggedInState(username);
		checkAccessToken();
		if (!friendSocket) {
			initFriendSocket();
		}
			loadChatHTML();
			pendingFriendRequest();
			await loadFriends();
			await updateFriendDropdown();
		return;
    }
	else {
        showLoggedOutState();
		document.getElementById('chat').innerHTML = '';
    }
};

window.dropDownMenu = dropDownMenu;

export async function dropDownMenu(){
	if(await getLoginStatus() === true){
        if(!friendSocket){
            initFriendSocket();
        }
        pendingFriendRequest();
        await loadFriends();
        await updateFriendDropdown();
	}
}
