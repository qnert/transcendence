import { handleRouteToken } from "../basics.js";

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
    const refreshToken = localStorage.getItem("refresh_token");
    try {
        const response = await fetch("/token/refresh/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
            throw new Error("Token refresh failed");
        }
        const data = await response.json();
        localStorage.setItem("access_token", data.access);
    } catch (error) {
        console.error("Token refresh error:", error);
        alert("Token refresh failed. Please login again.");
        handleRouteToken("/home/");
    }
}
