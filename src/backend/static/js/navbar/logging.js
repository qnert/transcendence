import { checkAccessToken } from "../profile/profile.js";
import { getAccessToken } from "../security/jwt.js";
import { updateContent, updateContentToken } from "../basics.js";
import { getCookie } from "../security/csrft.js";
import { loadFriends } from "../friends/fetch_friends.js";

export function setPasswd() {
    const passwd = document.getElementById("setPasswd");
    if (passwd) {
        passwd.addEventListener("click", async function (event) {
            event.preventDefault();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Passwords do not match! Try again!");
            } else {
                const csrftoken = getCookie("csrftoken");
                const token = localStorage.getItem("access_token");
                try {
                    const response = await fetch("/api/set_passwd/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrftoken,
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ password: confirmPassword }),
                    });
                    if (!response.ok) {
						if(response. status === 401){
						}
                        alert(response.error);
                    }
                    alert("Setting your passwd was successful!");
                    window.history.pushState({ path: "/login/" }, "", "/login/");
                    updateContent("/login/");
                } catch (error) {
                    console.error("something went wrong");
                }
            }
        });
    }
}

export function oauth() {
    const registerButton = document.getElementById("registerButton");
    if (registerButton) {
        registerButton.addEventListener("click", (event) => {
            event.preventDefault();
            const token = localStorage.getItem("access_token");
            fetch("/api/oauth/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.text().then((text) => {
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
        });
    }
}




export function logout() {
    const logoutButton = document.getElementById("logout");
    if (logoutButton) {
        const newLogoutButton = logoutButton.cloneNode(true);
        logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
        newLogoutButton.addEventListener("click", async function (event) {
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
					throw new Error("Logout fail");
				} 
				const access_token = localStorage.getItem("access_token");
				if(access_token){
					localStorage.removeItem("access_token");
				}
				const refresh_token = localStorage.getItem("refresh_token");
				if(refresh_token){
					localStorage.removeItem("refresh_token");
				}
                checkAccessToken();
                window.history.pushState({ path: "/login/" }, "", "/login/");
                updateContent("/login/");
            } catch (error) {
                console.log("Error in logout", error);
            }
        });
    }
}


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
            throw new Error("Storing JWT failed");
        }
    } catch (error) {
        console.error("Storing JWT error:", error);
    }
}


export function login() {
    const Login = document.getElementById("loginFormContent");
    if (Login) {
        Login.addEventListener("submit", async function (event) {
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
                if (!response.ok) throw new Error("Login failed");

                const twoFAResponse = await fetch("/api/get_2fa_status/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                });
                if (!twoFAResponse.ok) throw new Error("Getting 2FA status failed");
                const twoFAResponseData = await twoFAResponse.json();
                if (twoFAResponseData.enable === true) {
                    await getAccessToken(username, password, csrftoken);
					await storeJWT();
                    window.history.pushState({ path: "/2FA/" }, "", "/2FA/");
                    updateContentToken("/2FA/");
					loadFriends();
                    checkAccessToken();
				}
				else {
					await getAccessToken(username, password, csrftoken);
					await storeJWT();
                    window.history.pushState({ path: "/home/" }, "", "/home/");
                    updateContent("/home/");
                    loadFriends();
                    checkAccessToken();
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Login failed. Please try again.");
            }
        });
    }
}
