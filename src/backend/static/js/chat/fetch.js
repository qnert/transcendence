import { getCookie } from "../security/csrft.js";
import { loadFriends } from "../friends/fetch.js";

function blockUser(userId) {
	const csrftoken = getCookie("csrftoken")
  fetch(`/api/block/${userId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({})
  })
    .then(response => response.json())
    .then(data => {
      updateFriendDropdown();
      loadFriends();
    })
    .catch(error => console.error('Error blocking user:', error));
}

function unblockUser(userId) {
	const csrftoken = getCookie("csrftoken");
  fetch(`/api/unblock/${userId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken  
    },
    body: JSON.stringify({})
  })
    .then(response => response.json())
    .then(data => {
      updateFriendDropdown();
      loadFriends();
    })
    .catch(error => console.error('Error unblocking user:', error));
}

  