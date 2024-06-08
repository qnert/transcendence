import { updateContent } from "../basics.js";


document.addEventListener("DOMContentLoaded", function() {
  const registration = document.getElementById("passwordForm");
  if (registration) {
    const currentUrl = window.location.href;
    if (currentUrl.includes('/set_passwd')) {
      fetch("/api/fetch_user_data/")
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            alert("Already logged in");
            window.history.pushState({ path: '/login/' }, '', '/login/');
            updateContent("/login/");
          }
          console.log("Getting User data successful");
        })
        .catch(error => {
          console.error('Error during fetch:', error);
        });
    }
  }
});
