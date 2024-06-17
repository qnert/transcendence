import { updateContent } from "../basics.js";
import { logout } from "../navbar/logging.js";
import { showLoggedOutState, showLoggedInState } from "../navbar/navbar.js";
import { getCookie } from "../security/csrft.js";



export function setNewPasswd() {
    const passwd = document.getElementById("newPasswdButton");
    if (passwd) {
        passwd.addEventListener("click", async function (event) {
            event.preventDefault();
            const oldPassword = document.getElementById("oldPassword").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            if (password !== confirmPassword) {
				alert("Passwords do not match! Try again!");
				} else {
				const newPassword = passwd.cloneNode(true);
				passwd.parentNode.replaceChild(newPassword, passwd);
                const csrftoken = getCookie("csrftoken");
                const token = localStorage.getItem("access_token");
                try {
                    const response = await fetch("/api/set_new_passwd/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrftoken,
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ password: confirmPassword, old_passwd: oldPassword }),
                    });
                    if (!response.ok) {
                        alert(response.error);
                    }
                    alert("Setting your new password was successful!");
                } catch (error) {
                    console.error("something went wrong");
                }
            }
        });
    }
}

async function getUsernameFromBackend() {
    try {
        const response = await fetch("/api/get_username", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const userData = await response.json();
            const username = userData.username;
            return username;
        } else {
            throw new Error("Failed to get username from backend");
        }
    } catch (error) {
        console.error("Error getting username from backend:", error);
        throw error;
    }
}


export async function checkAccessToken() {
    const token = localStorage.getItem("access_token");
    if (token) {
        try {
            const response = await fetch("/token/verify/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ token: token }),
            });
            if (response.ok) {
                const username = await getUsernameFromBackend();
                showLoggedInState(username);
            } else {
                console.log("Token verification failed. Logging out.");
                showLoggedOutState();
                logout();
                window.history.pushState({ path: "/login/" }, "", "/login/");
                updateContent("/login/");
            }
        } catch (error) {
            console.error("Error verifying token:", error);
            showLoggedOutState();
            logout();
            window.history.pushState({ path: "/login/" }, "", "/login/");
            updateContent("/login/");
        }
    } else {
        console.log("No token found. Logging out.");
        showLoggedOutState();
        logout();
        window.history.pushState({ path: "/login/" }, "", "/login/");
        updateContent("/login/");
    }
}
