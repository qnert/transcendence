import { getCookie } from "./security/csrft.js";
import { loadFriends, pendingFriendRequest } from "./friends/fetch_friends.js";
import { loadChatHTML } from "./chat/action_chat.js";
import { initFriendSocket } from "./friends/action_friends.js";
import { friendSocket } from "./friends/action_friends.js";
import { handleRoute } from "./basics.js";

export async function checkLoginStatus() {
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
			if(response.status === 400){
				handleRoute("/login/");
				return;
			}
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
        if (response.ok && !friendSocket) { //check friendSocket to see if the user is already online
          initFriendSocket();
          loadChatHTML();
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
