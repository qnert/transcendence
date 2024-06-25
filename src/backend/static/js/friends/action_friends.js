import { loadFriends, sendFriendRequest, updateUserStatus } from './fetch_friends.js';
import { deleteFriend } from './fetch_friends.js';

  window.deleteFriend = deleteFriend;
  window.sendFriendRequest = sendFriendRequest;
  window.acceptRequest = acceptRequest;
  window.denyRequest = denyRequest;
  window.stopPropagation = stopPropagation;

  let userId = null;
  export let friendSocket = null;
  getUsernameFromBackend();

  function getUsernameFromBackend() {
    return fetch('/api/get_user_id/')
      .then(response => response.json())
      .then(data => {
        userId = data.id;
      })
      .catch(error => {
        console.error('Error loading user ID:', error);
        throw error;
      });
  }

  export function initFriendSocket() {
    friendSocket = new WebSocket(
    'ws://' + window.location.host + '/ws/online/'
    );

    friendSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        if (data.type === "friend_request_accepted") {
          updateFriendDropdown(data.friend_profile_picture_url, data.friend_name, data.friend_id);
          loadFriends();
        }
        else if (data.type === "user_status")
          updateUserStatus();
        else if (data.type === "friend_request_notification")
          displayAlert(data.friend_name, data.friend_id);
    };

    friendSocket.onclose = function (e) {
        console.log("Online socket closed");
    };
  }


function displayAlert(friendName, requestId) {
    const alertsContainer = document.getElementById("alerts-container");
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-primary d-flex align-items-center";
    alertDiv.role = "alert";

    alertDiv.innerHTML = `
        <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Info:">
            <use xlink:href="#info-fill"/>
        </svg>
        ${friendName} sent you a friend request!
        <a class="btn btn-success btn-sm ms-2" onclick="acceptRequest(${requestId}, this)">Accept</a>
        <a class="btn btn-danger btn-sm ms-2" onclick="denyRequest(${requestId}, this)">Deny</a>
    `;
    alertsContainer.appendChild(alertDiv);
}

export function updateFriendDropdown() {
  if (friendSocket) {
    fetch("/api/friends/")
        .then((response) => response.json())
        .then((data) => {
            const friendsMenu = document.getElementById("friends-list");
            friendsMenu.innerHTML = ""; // Clear existing content

            if (data.length === 0) {
                const noFriendsElement = document.createElement("li");
                noFriendsElement.id = "no-friends";
                noFriendsElement.innerHTML = `<span class="dropdown-item">No friends found</span>`;
                friendsMenu.appendChild(noFriendsElement);
            } else {
                data.forEach((friend) => {
                    const friendItem = document.createElement("li");
                    var onlineStatus = '<span style="visibility: hidden;" class="status-dot offline"></span>';

                    if (!friend.blocked_by && !friend.is_blocked) onlineStatus = '<span class="status-dot offline"></span>';
                    friendItem.className = "friend-item d-flex align-items-center justify-content-between px-2 py-1";
                    friendItem.id = `friend-${friend.user_id}`;
                    friendItem.innerHTML = `
			<div class="d-flex align-items-center">
			  ${onlineStatus}
			  <img src="${friend.profile_picture_url}" class="rounded-circle" style="width: 30px; height: 30px; margin-right: 8px;">
			  <button id="${friend.display_name}" class="btn btn-link search-result" onclick="loadContentFriend('${friend.display_name}')">${friend.display_name}</button>
			</div>
			<div class="dropdown">
			  <a class="dropdown-toggle" style="margin-right: 5px;" role="button" id="dropdownMenuButton${friend.user_id}" onclick="stopPropagation(event)" data-bs-toggle="dropdown" aria-expanded="false"></a>
			  <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton${friend.user_id}">
			    <li>
			      <button class="dropdown-item text-danger" onclick="deleteFriend(${friend.user_id}, this)">Remove Friend</button>
			    </li>
			  </ul>
			</div>
          `;
                    friendsMenu.appendChild(friendItem);
                });
            }
            updateUserStatus();
        });
  }
}

function removeAlert(element) {
    const alertDiv = element.closest(".alert");
    alertDiv.remove();
}

function stopPropagation(event) {
    event.stopPropagation();
}

export function searchFriends() {
    const searchFriends = document.getElementById("search-friends");
    if (searchFriends) {
        searchFriends.addEventListener("input", function () {
            const query = this.value;
            const resultsContainer = document.getElementById("search-results");

            if (query.length > 2) {
                fetch(`/api/search_friends/?q=${query}`)
                    .then((response) => response.json())
                    .then((data) => {
                        resultsContainer.innerHTML = "";
                        data.results.forEach((friend) => {
                            const resultItem = document.createElement("li");
                            resultItem.className = "dropdown-item mt-2";
                            resultItem.innerHTML = `
							<img src="${friend.profile_picture_url}" class="rounded-circle search-result" style="width: 30px; height: 30px; margin-right: 8px;">
							<button id="${friend.display_name}" class="btn btn-link search-result" onclick="loadContentFriend('${friend.display_name}')">${friend.display_name}</button>
							<button class="btn btn-sm btn-primary ms-2 search-result" onclick="sendFriendRequest(${friend.id})">Add Friend</button>
    	      				`;
                            resultsContainer.appendChild(resultItem);
                        });
                    });
            } else {
                resultsContainer.innerHTML = "";
            }
        });
    }
}

export function acceptRequest(requestId, element) {
  if (friendSocket && friendSocket.readyState === WebSocket.OPEN) {
    friendSocket.send(
      JSON.stringify({
        action: "accept",
        request_id: requestId,
      })
    );
    if (element.id != "accept_button_offline")
      removeAlert(element);
    else {
      element.closest(".friend-request-item").remove();
      updateFriendDropdown();
      loadFriends();
      checkFriendRequests();
    }
  } else {
    alert("Error Websocket not open");
  }
}

export function denyRequest(requestId, element) {
    if (friendSocket && friendSocket.readyState === WebSocket.OPEN) {
        friendSocket.send(
            JSON.stringify({
                action: "deny",
                request_id: requestId,
            })
        );
        if (element.id != "deny_button_offline") removeAlert(element);
        else {
            element.closest(".friend-request-item").remove();
            checkFriendRequests();
        }
    } else {
        alert("Error Websocket not open");
    }
}

function checkFriendRequests() {
    const friendRequestsContainer = document.getElementById("friend-requests");
    const friendRequestItems = friendRequestsContainer.getElementsByClassName("friend-request-item");

    if (friendRequestItems.length === 0) {
        friendRequestsContainer.remove();
    }
}
