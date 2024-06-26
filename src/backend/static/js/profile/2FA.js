import { checkAccessToken } from "../profile/profile.js";
import { handle401Error, handleRouteToken } from "../basics.js";
import { getCookie } from "../security/csrft.js";
import { loadFriends } from "../friends/fetch_friends.js";
import { updateFriendDropdown } from "../friends/action_friends.js";
async function activatetwoFA() {
    try {
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/Update_2FA_Status/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify({ enable: true }),
        });
        if (!response.ok) {
			if (response.status === 401){
				handle401Error();
				return;
			}
			else{
				throw new Error("Changing twoFA failed");
			}
        } else {
            alert("2FA activated");
        }
    } catch (error) {
        console.error("Token refresh error:", error);
    }
}

async function deactivatetwoFA() {
    try {
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("access_token");
        const response = await fetch("/api/Update_2FA_Status/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "X-CSRFToken": csrftoken,
            },
            body: JSON.stringify({ enable: false }),
        });
        if (!response.ok) {
			if (response.status === 401){
				handle401Error();
				return;
			}
			else{
				throw new Error("Changing twoFA failed");
			}
        } else {
            alert("2FA deactivated!");
        }
    } catch (error) {
        console.error("Token refresh error:", error);
    }
}

export async function checkBox() {
    const checkBox2FA = document.getElementById("checkBox2FA");
    if (checkBox2FA) {
        try {
            const csrftoken = getCookie("csrftoken");
            const token = localStorage.getItem("access_token");
            const response = await fetch("/api/get_2fa_status/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                    Authorization: `Bearer ${token}`,
                },
            });
			if (!response.ok) {
				if (response.status === 401){
					handle401Error();
					return;
				}
				else{
					throw new Error("Changing twoFA failed");
				}
			}
			else{
				const responeData = await response.json();
				if (responeData.enable === true) {
					checkBox2FA.checked = true;
					} else {
					checkBox2FA.checked = false;
				}
			}
        } catch (error) {
            console.error(error);
        }
    }
}

export function handleCheckbox() {
    const checkBox2FA = document.getElementById("checkBox2FA");
    if (checkBox2FA) {
        checkBox2FA.addEventListener("change", function () {
            if (checkBox2FA.checked) {
                activatetwoFA();
            } else {
                deactivatetwoFA();
            }
        });
    }
}

export async function validateOTPButton() {
    const validateButton = document.getElementById("validateOTP");
    if (validateButton) {
        validateButton.onclick = async function (event) {
            event.preventDefault();
			await validateOTP();
		}
	}
	const otpInput = document.getElementById("otpInput");
	if (otpInput){
		otpInput.onkeydown = async function(event) {
			if (event.key === 'Enter') {
				await validateOTP();
			}
		  };
	}	
}


async function validateOTP(){
    const otp = document.getElementById("otpInput").value;
    const csrftoken = getCookie("csrftoken");
    const token = localStorage.getItem("access_token");
    fetch("/api/validate_otp/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: otp }),
    })
    .then((response) => {
        if (response.status === 401) {
            handle401Error();
            return;
        }
        return response.json();
    })
    .then((data) => {
        if (data.valid) {
            window.history.pushState({ path: "/home/" }, "", "/home/");
            checkAccessToken();
            updateContentToken("/home/");
			loadFriends();
			updateFriendDropdown();
        } else {
            alert("Validation failed: Invalid OTP");
        }
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while validating the OTP");
    });
};

export function generateQRCode() {
    const qrcodeButton = document.getElementById("generateQRCode");
    if (qrcodeButton) {
        qrcodeButton.addEventListener("click", function (event) {
            event.preventDefault();
            const token = localStorage.getItem("access_token");
            fetch("/api/setup-2fa", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.status === 401) {
                    handle401Error();
                    throw new Error("Unauthorized access, logging out.");
                }
                return response.text();
            })
            .then((responseText) => {
                const data = JSON.parse(responseText);
                const qrCodeImg = document.getElementById("qrcode");
                qrCodeImg.src = "data:image/png;base64," + data.qr_code;
            })
            .catch((error) => {
                console.log("Error:", error);
            });
        });
    }
}
