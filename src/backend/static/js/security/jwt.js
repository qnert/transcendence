import { getLoginStatus, handle401Error, handleRouteToken } from "../basics.js";
import { checkLoginStatus } from "../login_check.js";
import { logout } from "../navbar/logging.js";

function checkJWTToken() {
    const access_token = localStorage.getItem("access_token");
    if (access_token === null && isLoggedIn()) {
        handleRouteToken("/home/");
    }
}

export async function getAccessToken(username, password, csrftoken) {
    try {
        const response = await fetch("/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
			if(response.status === 405 || response.status === 403){
				handle401Error();
				return;
			}
            throw new Error("Token failed");
        }
        const data = await response.json();
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
    } catch (error) {
        console.error("Token error:", error);
        alert("Token");
    }
}


//test if refresh token is null
async function refreshToken() {
	let test = getLoginStatus()
	if(test === true){
		const refreshToken = localStorage.getItem("refresh_token");
		if(!refreshToken){
			logout();
		}
		try {
			const response = await fetch("/token/refresh/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ refresh: refreshToken }),
			});
	
			if (!response.ok) {
				if(response.status === 405){
					handle401Error();
					return;
				}
				throw new Error("Token refresh failed");
			}
			const data = await response.json();
			localStorage.setItem("access_token", data.access);
			localStorage.setItem("refresh_token", data.refresh);
		} catch (error) {
			console.error("Token refresh error:", error);
			alert("Token refresh failed. Please login again.");
			handleRouteToken("/home/");
		}
	}
}
