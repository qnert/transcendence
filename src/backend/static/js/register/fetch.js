import { handle401Error, updateContent } from "../basics.js";
import { getCookie } from "../security/csrft.js";

document.addEventListener("DOMContentLoaded", function () {
    const currentUrl = window.location.href;
    if (currentUrl.includes("/set_passwd")) {
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("access_token");
        fetch("/api/fetch_user_data/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: csrftoken,
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    if (response.status === 400) {
                        alert("Already registered in");
                        window.history.pushState({ path: "/login/" }, "", "/login/");
                        updateContent("/login/");
                    } else if (response.status === 500) {
                        alert("You can't reload this page, or the 42 secret key expired");
                        window.history.pushState({ path: "/login/" }, "", "/login/");
                        updateContent("/login/");
                    } else if (response.status === 403) {
                        alert("You need to set a password");
                    } else if(response.status === 401){
						handle401Error();
						return;
					}else {
                        throw new Error("Fetching data failed");
                    }
                }
                return response.json();
            })
            .then((response) => {
                if (response.status === 200) {
                    alert("Set new Password");
                }
            })
            .catch((error) => {
                console.error("Error during fetch:", error);
            });
    }
});
