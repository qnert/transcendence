import { getCookie } from "../security/csrft.js";
import { loadFriends } from "../friends/fetch_friends.js";
import { updateFriendDropdown } from "../friends/action_friends.js";

window.unblockUser = unblockUser;
window.blockUser = blockUser;

export function blockUser(userId) {
    const csrftoken = getCookie("csrftoken");
    fetch(`/api/block/${userId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({}),
    })
        .then((response) => response.json())
        .then((data) => {
            updateFriendDropdown();
            loadFriends();
        })
        .catch((error) => console.error("Error blocking user:", error));
}

export function unblockUser(userId) {
    const csrftoken = getCookie("csrftoken");
    fetch(`/api/unblock/${userId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({}),
    })
        .then((response) => response.json())
        .then((data) => {
            updateFriendDropdown();
            loadFriends();
        })
        .catch((error) => console.error("Error unblocking user:", error));
}
