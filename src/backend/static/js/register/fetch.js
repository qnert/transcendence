import { handle401Error, handleRoute } from "../basics.js";
import { logout } from "../navbar/logging.js";
import { getCookie } from "../security/csrft.js";
import { getLoginStatus } from "../basics.js";

document.addEventListener("DOMContentLoaded", async function () {
    const currentUrl = window.location.href;
    if (currentUrl.includes("/set_passwd")) {
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("access_token");

        try {
            const response = await fetch("/api/fetch_user_data/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 400) {
                    alert("Already registered in");
                    handleRoute("/login/");
                } else if (response.status === 500) {
                    alert("You can't reload this page, or the 42 secret key expired");
                    if (await getLoginStatus()) {
                        await logout();
                    }
                    handleRoute("/login/");
                } else if (response.status === 403) {
                    alert("You need to set a password");
                } else if (response.status === 401 || response.status === 405) {
                    handle401Error();
                    return;
                } else {
                    throw new Error("Fetching data failed");
                }
            } else {
                const responseData = await response.json();
                if (response.status === 200) {
                    alert("Set new Password");
                }
            }
        } catch (error) {
            console.error("Error during fetch:", error);
        }
    }
});
