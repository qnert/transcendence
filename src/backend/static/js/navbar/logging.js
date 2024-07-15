import { checkAccessToken } from "../profile/profile.js";
import { getAccessToken } from "../security/jwt.js";
import { getLoginStatus, getUsername, handle401Error, handleRoute, handleRouteToken } from "../basics.js";
import { getCookie } from "../security/csrft.js";
import { loadFriends } from "../friends/fetch_friends.js";
import { friendSocket } from "../friends/action_friends.js";
import { showLoggedOutState } from "./navbar.js";
import { updateFriendDropdown } from "../friends/action_friends.js";
import { showLoggedInState } from "./navbar.js";
import { handleUrlChange } from "../basics.js";
import { loadChatHTML } from "../chat/action_chat.js";
import { initFriendSocket } from "../friends/action_friends.js";
import { pendingFriendRequest } from "../friends/fetch_friends.js";

export function setPasswd() {
    const passwd = document.getElementById("setPasswd");
    if (passwd) {
        passwd.onclick = async function (event) {
            event.preventDefault();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
			if (password.length < 3) {
				alert("Please enter a Password with atleast 4");
				return;
			}
            else if (password !== confirmPassword) {
                alert("Passwords do not match! Try again!");
            } else {
                const csrftoken = getCookie("csrftoken");
                try {
                    const response = await fetch("/api/set_passwd/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrftoken,
                        },
                        body: JSON.stringify({ password: confirmPassword }),
                    });
                    if (!response.ok) {
						if(response.status === 404){
							alert("User does not exist");
							handle401Error();
						}
                        else if(response. status === 401 || response.status === 405 || response.status === 403){
                          handle401Error();
						  return;
                        }
                    }
                    alert("Setting your passwd was successful!");
                    handleRoute("/login/");
                } catch (error) {
                    console.error("something went wrong");
                }
            }
        };
    }
}

export function oauth() {
    const registerButton = document.getElementById("registerButton");
    if (registerButton) {
        registerButton.onclick = async function (event){
            event.preventDefault();
            fetch("/api/oauth/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.text().then((text) => {
							handleRoute("/login/")
                            throw new Error(`Network response was not ok`);
                        });
                    }
                    return response.json();
                })
                .then((data) => {
                    window.location.href = data.url;
                })
                .catch((error) => {
                    console.error("Error during fetch:", error);
                });
        };
    }
}

export async function logoutButton() {
    const logoutButton = document.getElementById("logout");
    if (logoutButton) {
        logoutButton.onclick = async function (event) {
            event.preventDefault();
            const refreshToken = localStorage.getItem("refresh_token");
            const csrftoken = getCookie("csrftoken");
            const accessToken = localStorage.getItem("access_token");
            try {
                const response = await fetch("/api/logout/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                });
                if (!response.ok){
					if (response.status === 401){
						handle401Error();
						return
					}
					throw new Error("Logout fail");
				}
                if (friendSocket) {
                    friendSocket.close();
                }
				if(accessToken){
					localStorage.removeItem("access_token");
				}
				if(refreshToken){
					localStorage.removeItem("refresh_token");
				}
                handleRoute("/login/");
				document.getElementById('chat').innerHTML = '';
				showLoggedOutState();
				handleUrlChange();
            } catch (error) {
                console.log("Error in logout", error);
            }
        };
    }
}

export async function logout() {;
    const refreshToken = localStorage.getItem("refresh_token");
    const csrftoken = getCookie("csrftoken");
    const accessToken = localStorage.getItem("access_token");
    try {
        const response = await fetch("/api/logout/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
            },
        });
        if (!response.ok){
			if(response.status === 403){
				alert("CSRF Token not set");
				return;
			}
			throw new Error("Logout fail");
		}
        if (friendSocket) {
            friendSocket.close();
        }
		if(accessToken){
			localStorage.removeItem("access_token");
		}
		if(refreshToken){
			localStorage.removeItem("refresh_token");
		}
        handleRoute("/login/");
		document.getElementById('chat').innerHTML = '';
		showLoggedOutState();
		handleUrlChange();
    } catch (error) {
        console.log("Error in logout", error);
    }
};

async function storeJWT() {
    const refresh_token = localStorage.getItem("refresh_token");
	const csrftoken = getCookie("csrftoken");

    try {
        const response = await fetch("/api/store_jwt/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
				"X-CSRFToken": csrftoken,
            },
            body: JSON.stringify({ refresh_token: refresh_token })
        });

        if (!response.ok) {
			if(response.status === 403){
				handle401Error();
				return;
			}
            throw new Error("Storing JWT failed");
        }
    } catch (error) {
        console.error("Storing JWT error:", error);
    }
}


export async function login() {
    const Login = document.getElementById("loginFormContent");
    if (Login) {
        Login.onsubmit = async function (event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            const csrftoken = getCookie("csrftoken");
            try {
                const response = await fetch("/api/login/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                    body: JSON.stringify({ username, password }),
                });
                if (!response.ok){
					if(response.status === 401){
						alert("invalid credentials")
						handle401Error();
					}
					else if(response.status === 400){
						alert("User already logged in");
						// handle401Error();
					}
					return;
				}
                const twoFAResponse = await fetch("/api/get_2fa_status/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                });
                if (!twoFAResponse.ok){
					throw new Error("Getting 2FA status failed");
				}
                const twoFAResponseData = await twoFAResponse.json();
                if (twoFAResponseData.enable === true) {
                    await getAccessToken(username, password, csrftoken);
					await storeJWT();
                    handleRouteToken("/2FA/");
				}
				else {
					await getAccessToken(username, password, csrftoken);
					await storeJWT();
                    handleRouteToken("/home/");
					showLoggedInState(username);
					if (!friendSocket) { //check friendSocket to see if the user is already online
						initFriendSocket();
					}
						loadChatHTML();
						pendingFriendRequest();
						await loadFriends();
						await updateFriendDropdown();
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Login failed. Please try again.");
            }
        };
    }
}
