import { getCookie } from "../security/csrft.js";
import { updateFriendDropdown, acceptRequest, denyRequest } from "./action_friends.js";
import { selectFriend } from "../chat/action_chat.js";
import { friendSocket } from "./action_friends.js";
import { blockUser, unblockUser } from "../chat/fetch_chat.js";

window.acceptRequest = acceptRequest;
window.denyRequest = denyRequest;

export function loadFriends() {
  if (friendSocket) {
    fetch("/api/friends/")
        .then((response) => response.json())
        .then((data) => {
            const friendList = document.getElementById("friendList");
            if (friendList) {
              friendList.innerHTML = "";
              data.forEach((friend) => {
                  const li = document.createElement("li");
                  li.id = `friend-${friend.user_id}`;
                  li.dataset.friendId = friend.user_id;

                  const img = document.createElement("img");
                  img.src = friend.profile_picture_url;
                  img.alt = friend.display_name;

                  const statusText = document.createElement("span");
                  statusText.id = `chat-status-${friend.user_id}`;
                  statusText.className = "status-text " + (friend.is_online ? "online" : "offline");
                  statusText.textContent = friend.is_online ? "online" : "offline";

                  const friendDetails = document.createElement("div");
                  friendDetails.className = "friend-details";
                  friendDetails.appendChild(img);
                  friendDetails.appendChild(statusText);

                  const friendInfo = document.createElement("div");
                  friendInfo.className = "friend-info";

                  const nameAndButtons = document.createElement("div");
                  nameAndButtons.className = "name-and-buttons";

                  const span_name = document.createElement("span");
                  span_name.textContent = friend.display_name;

                  const messageButton = document.createElement("button");
                  messageButton.textContent = "Message";
                  messageButton.onclick = () => selectFriend(friend.user_id, friend.display_name);

                  const blockButton = document.createElement("button");
                  blockButton.textContent = "Block";
                  blockButton.onclick = () => blockUser(friend.user_id);

                  const unblockButton = document.createElement("button");
                  unblockButton.textContent = "Unblock";
                  unblockButton.onclick = () => unblockUser(friend.user_id);
                  unblockButton.style.display = "none";

                  if (friend.is_blocked) {
                      messageButton.style.display = "none";
                      blockButton.style.display = "none";
                      statusText.style.display = "none";
                      unblockButton.style.display = "inline";
                  }

                  if (friend.blocked_by) {
                      statusText.style.display = "none";
                  }

                  nameAndButtons.appendChild(span_name);
                  nameAndButtons.appendChild(messageButton);
                  nameAndButtons.appendChild(blockButton);
                  nameAndButtons.appendChild(unblockButton);

                  friendInfo.appendChild(nameAndButtons);

                  li.appendChild(friendDetails);
                  li.appendChild(friendInfo);
                  friendList.appendChild(li);
            });
            }
        })
        .catch((error) => console.error("Error loading friends:", error));
  }
}

export function updateUserStatus() {
    fetch("/api/friends_online_status/")
        .then((response) => response.json())
        .then((data) => {
            Object.keys(data).forEach((userId) => {
                const status = data[userId] ? "online" : "offline";
                const friendItem = document.getElementById(`friend-${userId}`);
                const chatStatusText = document.getElementById(`chat-status-${userId}`);

                if (friendItem) {
                    const statusDot = friendItem.querySelector(".status-dot");
					if(statusDot){
						if (status === "online") {
							statusDot.classList.add("online");
							statusDot.classList.remove("offline");
						} else {
							statusDot.classList.add("offline");
							statusDot.classList.remove("online");
						}
					}
                }

                if (chatStatusText) {
                    if (status === "online") {
                        chatStatusText.classList.add("online");
                        chatStatusText.classList.remove("offline");
                        chatStatusText.textContent = "online";
                    } else {
                        chatStatusText.classList.add("offline");
                        chatStatusText.classList.remove("online");
                        chatStatusText.textContent = "offline";
                    }
                }
            });
        })
        .catch((error) => console.error("Error fetching friends or online status:", error));
}

export function sendFriendRequest(userId) {
	const csrftoken = getCookie("csrftoken");
  fetch('/api/send_friend_request/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({ user_id: userId })
  }).then(response => response.json())
    .then(data => {
      alert(data.message);
      document.getElementById('search-friends').value = '';
      document.getElementById('search-results').innerHTML = '';
    });
}

export function deleteFriend(friendId, element) {
    const csrftoken = getCookie("csrftoken");
    fetch("/api/delete_friend/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({ friend_id: friendId }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Remove the friend item from the dropdown
                const friendItem = element.closest(".friend-item");
                friendItem.remove();
                // Check if no friends left and show "No friends found" message
                const friendsMenu = document.getElementById("friends-list");
                if (friendsMenu.children.length === 0) {
                    const noFriendsElement = document.createElement("li");
                    noFriendsElement.id = "no-friends";
                    noFriendsElement.innerHTML = `<span class="dropdown-item">No friends found</span>`;
                    friendsMenu.appendChild(noFriendsElement);
                }
            } else {
                alert(data.message);
            }
        });
}

export async function pendingFriendRequest() {
    // Fetch friend requests first
    const friendRequest = document.getElementById("friend-requests");
    if (friendRequest) {
        fetch("/api/pending_friend_requests/")
            .then((response) => response.json())
            .then((data) => {
                const friendRequestsDiv = document.getElementById("friend-requests");
                friendRequestsDiv.innerHTML = ""; // Clear existing content

                if (data.length > 0) {
                    friendRequestsDiv.innerHTML = `
			  <div class="dropdown-divider"></div>
			  <h5 class="dropdown-header">Friend Requests</h5>
			`;
                    data.forEach((request) => {
                        const requestItem = document.createElement("div");
                        requestItem.className = "friend-request-item d-flex align-items-center justify-content-between px-2 py-1";
                        requestItem.innerHTML = `
				<div class="d-flex align-items-center">
				  <img src="${request.profile_picture_url}" class="rounded-circle" style="width: 30px; height: 30px; margin-right: 8px;">
				  <span>${request.from_user_name}</span>
				</div>
				<div>
				  <button class="btn btn-success btn-sm" id="accept_button_offline" onclick="acceptRequest(${request.from_user_id}, this)">Accept</button>
				  <button class="btn btn-danger btn-sm" id="deny_button_offline" onclick="denyRequest(${request.from_user_id}, this)">Deny</button>
				</div>
			  `;
                        friendRequestsDiv.appendChild(requestItem);
                    });
                }
            });
      }
    updateFriendDropdown();
}
