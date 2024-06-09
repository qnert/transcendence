import { showLoggedOutState, showLoggedInState } from "../navbar/navbar.js";
import { getCookie } from "../security/csrft.js";

export function setNewPasswd(){
  const passwd = document.getElementById("newPasswdButton");
  if (passwd) {
    passwd.addEventListener("click", async function(event){
      event.preventDefault();
      const oldPassword = document.getElementById('oldPassword').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if(password !== confirmPassword){
        alert("Passwords do not match! Try again!")
      }
      else{
        const csrftoken = getCookie("csrftoken")
        try{
          const response = await fetch("/api/set_new_passwd/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrftoken,
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({password:confirmPassword, old_passwd:oldPassword})
          });
          if(!response.ok){
            alert(response.error);
          }
          alert("Setting your new password was successful!")
        }
        catch(error) {
          console.error("something went wrong");
        }
      }
    });
  }
}


async function getUsernameFromBackend(token) {
  try {
    const response = await fetch("/api/get_username", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      }
    });
    if (response.ok) {
      const userData = await response.json();
      const username = userData.username;
      return username;
    } else {
      throw new Error("Failed to get username from backend");
    }
  } catch (error) {
    console.error("Error getting username from backend:", error);
    throw error;
  }
}


export async function checkAccessToken() {
  const token = localStorage.getItem("access_token");
  if (token) {
    try {
      const response = await fetch("/token/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ token: token }),
      });
      if (response.ok) {
        const username = await getUsernameFromBackend(token);
        showLoggedInState(username);
      } else {
        showLoggedOutState();
        console.log("hello");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      showLoggedOutState();
    }
  } else {
    showLoggedOutState();
  }
};
