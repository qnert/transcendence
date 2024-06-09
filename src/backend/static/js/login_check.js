import { getCookie } from "./security/csrft.js";
import { loadFriends, pendingFriendRequest } from "./friends/fetch_friends.js";
import { loadChatHTML } from "./chat/action_chat.js";

export async function checkLoginStatus() {
    const currentUrl = window.location.href;
    const csrftoken = getCookie("csrftoken");
    try {
        const response = await fetch("/api/check_login_status/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
            },
        });

        if (!response.ok) {
            throw new Error("Getting login status failed");
        }

    const responseData = await response.json();
    if (responseData.status === true && localStorage.getItem("access_token")) {
      loadChatHTML();
      loadFriends();
      pendingFriendRequest();
    }
    else {
      document.getElementById('chat').innerHTML = '';
    }
  } catch (error) {
    console.error("Error during fetch:", error);
  }
};
