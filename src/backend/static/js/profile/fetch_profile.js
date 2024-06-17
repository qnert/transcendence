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
            console.log("Raw Response Status:", response.status);
            return response.text();
        })
        .then((rawData) => {
            try {
                const data = JSON.parse(rawData);
                if (data) {
                    document.getElementById("profile-name").textContent = data.username;
                    document.getElementById("profile-username").value = data.username;
                    document.getElementById("profile-email").value = data.email;
                    document.getElementById("profile-display_name").value = data.display_name;
                    document.getElementById("profile-picture_url").value = data.picture_url;
                    const profilePictureUrl = data.profile_picture;
                    if (profilePictureUrl) {
                        console.log(profilePictureUrl);
                        const profilePicture = document.getElementById("profile-picture");
                        profilePicture.setAttribute("src", profilePictureUrl);
                    }
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
            }
        })
        .catch((error) => {
            console.error("Error fetching profile data:", error);
        });
}
