import { handleRoute } from "../basics.js";
import { fetchProfileData } from "./fetch_profile.js";
import { getCookie } from "../security/csrft.js";
import { checkBox } from "./2FA.js";


window.onload = function () {
    const currentUrl = window.location.href;
    console.log(currentUrl);
    if (currentUrl.includes("/profile/")) {
        fetchProfileData();
    	bindSaveChangesButton();
    	bindProfileButton();
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const currentUrl = window.location.href;
    if (currentUrl.includes("/profile/")) {
        fetchProfileData();
    	bindSaveChangesButton();
    	bindProfileButton();
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    const currentUrl = window.location.href;
    if (currentUrl.includes("profile/")) {
		checkBox();
    }
});

window.onload = async function () {
    const currentUrl = window.location.href;
    if (currentUrl.includes("profile")) {
		checkBox();
    }
};


export async function saveChanges() {
    const picture_url = document.getElementById("profile-picture_url").value;
    const display_name = document.getElementById("profile-display_name").value;
    const csrftoken = getCookie("csrftoken");
    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch("/api/save_changes/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ display_name: display_name, picture_url: picture_url }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error);
        } else {
            alert("Settings got changed");
            fetchProfileData();
        }
    } catch (error) {
        console.error("Something went wrong:", error);
    }
}

export function bindSaveChangesButton() {
    const saveChangesButton = document.getElementById("saveChangesButton");
    if (saveChangesButton) {
        saveChangesButton.addEventListener("click", function (event) {
            event.preventDefault();
            saveChanges();
        });
    }
}


export function bindProfileButton() {
    const profileButton = document.getElementById("profile");
    if (profileButton) {
        profileButton.addEventListener("click", function (event) {
            event.preventDefault();
            handleRoute(event, "/profile/");
            fetchProfileData();
        });
    }
}
