
document.addEventListener("DOMContentLoaded", async function() {
  const csrftoken = getCookie("csrftoken");
  try {
    const response = await fetch("/api/check_login_status/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error("Getting login status failed");
    }

    const responseData = await response.json();
    if (responseData.status === true) {
      loadFriends();
      pendingFriendRequest();
    }
  } catch (error) {
    console.error("Error during fetch:", error);
  }
});
