import { handle401Error, handleRoute, updateContentToken } from "../basics.js";
import { fetchProfileData } from "./fetch_profile.js";
import { getCookie } from "../security/csrft.js";
import { checkBox } from "./2FA.js";

export async function saveChanges() {
    const picture_url = document.getElementById("profile-picture_url").value;
    const display_name = document.getElementById("profile-display_name").value;
	if (display_name.length < 1 || display_name.trim() === ""){
		alert("display name must be atleast 1 character long");
		return;
	}
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
			if(response.status === 401){
				handle401Error();
				return;
			}
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
        saveChangesButton.onclick = function (event) {
            event.preventDefault();
            saveChanges();
        };
    }
}

export async function bindProfileButton() {
    const profileButton = document.getElementById("profile");
    if (profileButton) {
        profileButton.onclick = async (event) => {
            event.preventDefault()
            await handleRoute(event, "/profile/");
            await fetchProfileData();
        };
    }
}
