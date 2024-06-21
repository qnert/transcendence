import { handle401Error } from "../basics.js";



export async function fetchProfileData() {
    const token = localStorage.getItem("access_token");

    try {
        const response = await fetch("/api/get_profile/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                handle401Error();
                return;
            }
            if (response.status === 405) {
                console.log("Method not allowed");
                return;
            }
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data) {
            const profileName = document.getElementById("profile-name");
            if (profileName) profileName.textContent = data.username;

            const profileUsername = document.getElementById("profile-username");
            if (profileUsername) profileUsername.value = data.username;

            const profileEmail = document.getElementById("profile-email");
            if (profileEmail) profileEmail.value = data.email;

            const displayName = document.getElementById("profile-display_name");
            if (displayName) displayName.value = data.display_name;

            const profilePictureURL = document.getElementById("profile-picture_url");
            if (profilePictureURL) profilePictureURL.value = data.picture_url;

            const profilePicture = document.getElementById("profile-picture");
            if (profilePicture && data.profile_picture) {
                profilePicture.setAttribute("src", data.profile_picture);
            }
        }
    } catch (error) {
        console.error("Error fetching profile data:", error);
    }
}



export async function fetchFriendsData(display_name){
	const token = localStorage.getItem("access_token");

    try {
        const response = await fetch("/api/get_friends_profile/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
			body: JSON.stringify({display_name:display_name})
        });

        if (!response.ok) {
            if (response.status === 401) {
                handle401Error();
                return;
            }
            if (response.status === 405) {
                console.log("Method not allowed");
                return;
            }
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data) {
            const profileName = document.getElementById("profile-name");
            if (profileName) profileName.textContent = data.username;

            const profileUsername = document.getElementById("profile-username");
            if (profileUsername) profileUsername.value = data.username;

            const profileEmail = document.getElementById("profile-email");
            if (profileEmail) profileEmail.value = data.email;

            const displayName = document.getElementById("profile-display_name");
            if (displayName) displayName.value = data.display_name;

            const profilePictureURL = document.getElementById("profile-picture_url");
            if (profilePictureURL) profilePictureURL.value = data.picture_url;

            const profilePicture = document.getElementById("profile-picture");
            if (profilePicture && data.profile_picture) {
                profilePicture.setAttribute("src", data.profile_picture);
            }
        }
    } catch (error) {
        console.error("Error fetching profile data:", error);
    }
}