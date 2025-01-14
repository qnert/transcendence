import { getCookie } from "./security/csrft.js";
import { loadFriends, pendingFriendRequest } from "./friends/fetch_friends.js";
import { loadChatHTML } from "./chat/action_chat.js";
import { getFriendSocketStatus, initFriendSocket } from "./friends/action_friends.js";
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
			if (response.status === 401 || response.status === 405 || response.status === 403){
				handle401Error();
				}
			return;
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
		if (!response.ok) {
			if (response.status === 401 || response.status === 405){
				handle401Error();
				return;
			}
		}
        if (response.ok && !getFriendSocketStatus()) {
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
