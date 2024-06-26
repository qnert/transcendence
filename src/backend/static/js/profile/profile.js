import { handle401Error, handleRoute } from "../basics.js";
import { logout } from "../navbar/logging.js";
import { showLoggedOutState, showLoggedInState } from "../navbar/navbar.js";
import { getCookie } from "../security/csrft.js";



export function setNewPasswd() {
    const passwd = document.getElementById("newPasswdButton");
    if (passwd) {
        passwd.onclick = async function (event) {
            event.preventDefault();
            const oldPassword = document.getElementById("oldPassword").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
			if (password.length < 3) {
				alert("Please enter a Password with atleast 4");
				return;
			}
			else if (password !== confirmPassword) {
				alert("Passwords do not match! Try again!");
			}
			else {
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
						if(response.status === 401){
							handle401Error();
							alert(response.error);
							return;
						}
						else if(response.status === 403){
							alert("Incorrect old Password");
							return ;
						}
                    }
                    alert("Setting your new password was successful!");
                } catch (error) {
                    console.error("something went wrong");
                }
            }
        };
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
			if(response.status === 401){
				handle401Error()
				return ;
			}
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
                const url = window.location.href;
                if (!url.includes("set_passwd")){
                    console.log("Token verification failed. Logging out.");
                    logout();
                    handleRoute("/login/");
                }
            }
        } catch (error) {
            console.error("Error verifying token:", error);
            logout();
            handleRoute("/login/");
        }
    } else {
        const url = window.location.href;
        if (!url.includes("set_passwd")){
            console.log("No token found. Logging out.");
            logout();
            handleRoute("/login/");
        }
    }
}
