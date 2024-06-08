import { checkAccessToken } from "../profile/profile.js";
import { getAccessToken } from "../security/jwt.js";
import { updateContent } from "../basics.js";
import { getCookie } from "../security/csrft.js";
import { loadFriends } from "../friends/fetch.js";

export function set_passwd(){
  const passwd = document.getElementById("set_passwd");
  if (passwd) {
    passwd.addEventListener("click", async function(event){
      event.preventDefault();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if(password !== confirmPassword){
        alert("Passwords do not match! Try again!")
      }
      else{
        const csrftoken = getCookie("csrftoken")
        try{
          const response = await fetch("/api/set_passwd/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrftoken,
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({password:confirmPassword})
          });
          if(!response.ok){
            alert(response.error);
          }
          alert("Setting your passwd was successful!")
          window.history.pushState({ path: '/login/' }, '', '/login/');
          updateContent("/login/");
        }
        catch(error) {
          console.error("something went wrong");
        }
      }
    });
  }
}

export function oauth() {
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.addEventListener("click", (event) => {
      event.preventDefault();
      fetch("/api/oauth/")
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`Network response was not ok`);
            });
          }
          return response.json();
        })
        .then(data => {
          console.log("hello")
          window.location.href = data.url;
        })
        .catch(error => {
          console.error('Error during fetch:', error);
        });
    });
  }
}

export function logout() {
  const logoutButton = document.getElementById("logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", async function(event) {
      event.preventDefault();
      const refreshToken = localStorage.getItem("refresh_token");
      const csrftoken = getCookie("csrftoken");
      try {
        const response = await fetch("/api/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (!response.ok)
          throw new Error("Logout fail");
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setLoginStatus('false');
        checkAccessToken();
        window.history.pushState({ path: '/login/' }, '', '/login/');
        updateContent("/login/");

      } catch (error) {
        console.log("Error in logout", error);
      }
    });
  }
}

export function login() {
  const Login = document.getElementById("loginFormContent");
  if (Login) {
    Login.addEventListener("submit", async function(event) {
      event.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const csrftoken = getCookie("csrftoken");

      try {
        const response = await fetch("/api/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ username, password }),
        });
        if (!response.ok)
          throw new Error("Login failed");

        const twoFAResponse = await fetch("/api/get_2fa_status/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
            'Cache-Control': 'no-cache'
          },
        });
        if (!twoFAResponse.ok)
          throw new Error("Getting 2FA status failed");
        const twoFAResponseData = await twoFAResponse.json();
        if (twoFAResponseData.status === true) {
          console.log("that");
          window.history.pushState({ path: '/2FA/' }, '', '/2FA/');
          updateContent("/2FA/");
          await getAccessToken(username, password, csrftoken);
        }
        else{
          console.log("this");
          await getAccessToken(username, password, csrftoken);
          window.history.pushState({ path: '/home/' }, '', '/home/');
          updateContent("/home/");
          loadFriends();
          checkAccessToken();
        }
      } catch(error) {
        console.error("Login error:", error);
        alert("Login failed. Please try again.");
      }
    });
  }
}
  