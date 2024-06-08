import { checkAccessToken } from "../profile/profile.js";
import { updateContent } from "../basics.js";
import { getCookie } from "../security/csrft.js";





async function activatetwoFA(){
  try {
    const csrftoken = getCookie("csrftoken");
    const response = await fetch("/api/Update_2FA_Status/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Cache-Control': 'no-cache',
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({ enable: true })
    });
    if (!response.ok) {
      throw new Error("Changing twoFA failed");
    }
    else{
      alert("2FA activated")
    }
  } catch (error) {
    console.error("Token refresh error:", error);
  }
}


async function deactivatetwoFA(){
  try {
    const csrftoken = getCookie("csrftoken");
    const response = await fetch("/api/Update_2FA_Status/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Cache-Control': 'no-cache',
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({ enable: false })
    });
    if (!response.ok) {
      throw new Error("Changing twoFA failed");
    }
    else{
      alert("2FA deactivated!")
    }
  } catch (error) {
    console.error("Token refresh error:", error);
  }
}


export async function checkBox() {
  const checkBox = document.getElementById('checkBox');
  if (checkBox) {
    try {
    const csrftoken = getCookie("csrftoken");
    const twoFAResponse = await fetch("/api/get_2fa_status/", {
      method: "GET",
      headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
      'Cache-Control': 'no-cache'
      },
    });
    if (!twoFAResponse.ok) throw new Error("Getting 2FA status failed");

    const twoFAResponseData = await twoFAResponse.json();
    if (twoFAResponseData.enable === true) {
      checkBox.checked = true;
    }
    else{
      checkBox.checked = false;
    }
    } catch (error) {
    console.error(error);
    }
  }
  };

  window.onload = async function() {
    checkBox();
  };


export function handleCheckbox(){
  const checkBox = document.getElementById("checkBox");
  if(checkBox){
    checkBox.addEventListener("change", function(){
      if(checkBox.checked)
        activatetwoFA();
      else{
        deactivatetwoFA();
      }
    });
  }
}

export function validateOTP() {
  const validateButton = document.getElementById("validateOTP");
  if (validateButton) {
      validateButton.addEventListener("click", function(event) {
          event.preventDefault();
          const otp = document.getElementById("otpInput").value;
          const csrftoken = getCookie("csrftoken");
          fetch("/api/validateOTP/", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": csrftoken,
                  'Cache-Control': 'no-cache'
              },
              body: JSON.stringify({otp: otp })
          })
          .then(response => response.json())
          .then(data => {
              if (data.valid) {
    window.history.pushState({ path: '/home/' }, '', '/home/');
    checkAccessToken();
    updateContent("/home/");
              } else {
                  alert("Validation failed: Invalid OTP");
              }
          })
          .catch(error => {
              console.error("Error:", error);
              alert("An error occurred while validating the OTP");
          });
      });
  }
}

export function generateQRCode() {
  const qrcodeButton = document.getElementById("generateQRCode");
  if (qrcodeButton) {
    qrcodeButton.addEventListener("click", function(event) {
      event.preventDefault();
      fetch("/api/setup-2fa", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then(responseText => {
        const data = JSON.parse(responseText);
        const qrCodeImg = document.getElementById("qrcode");
        qrCodeImg.src = "data:image/png;base64," + data.qr_code;
      })
      .catch(error => {
        console.log("Error:", error);
      });
    });
  }
}
