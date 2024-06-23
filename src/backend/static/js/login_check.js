import { getCookie } from "./security/csrft.js";
import { loadFriends, pendingFriendRequest } from "./friends/fetch_friends.js";
import { loadChatHTML } from "./chat/action_chat.js";
import { initFriendSocket } from "./friends/action_friends.js";

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
    const token = localStorage.getItem("access_token");
    if (responseData.status === true && token) {
      try {
        const response = await fetch("/token/verify/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ token: token }),
        });
        if (response.ok) {
          initFriendSocket();
          loadChatHTML();
          loadFriends();
          pendingFriendRequest();
        }
      } catch (error) {
          console.error("Error verifying token:", error);
      }
    }
    else {
      document.getElementById('chat').innerHTML = '';
    }
  } catch (error) {
    console.error("Error during fetch:", error);
  }
};
