import { handle401Error } from "../basics.js";



export function fetchProfileData() {
    const token = localStorage.getItem("access_token");
    fetch("/api/get_profile/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    })
	.then((response) => {
		if (!response.ok) {
			if (response.status == 401) {
				handle401Error();
				return;
			}
			if (response.status == 405) {
				console.log("Method not allowed");
				return;
			}
		}
		return response.json();
	})
    .then((data) => {
        if (data) {
            document.getElementById("profile-name").textContent = data.username;
            document.getElementById("profile-username").value = data.username;
            document.getElementById("profile-email").value = data.email;
            document.getElementById("profile-display_name").value = data.display_name;
            document.getElementById("profile-picture_url").value = data.picture_url;
            const profilePictureUrl = data.profile_picture;
            if (profilePictureUrl) {
                const profilePicture = document.getElementById("profile-picture");
                profilePicture.setAttribute("src", profilePictureUrl);
            }
        }
    })
    .catch((error) => {
        console.error("Error fetching profile data:", error);
    });
}