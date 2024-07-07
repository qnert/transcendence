import { checkAccessToken } from "../profile/profile.js";
import { getUsername, handle401Error, handleRouteToken } from "../basics.js";
import { getCookie } from "../security/csrft.js";
import { loadFriends } from "../friends/fetch_friends.js";
import { updateFriendDropdown } from "../friends/action_friends.js";
import { updateContentToken } from "../basics.js";
import { showLoggedInState } from "../navbar/navbar.js";


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
			if (response.status === 401 || response.status === 405 || response.status === 403){
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
			if (response.status === 401 || response.status === 405 || response.status === 403){
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
				if (response.status === 401 || response.status === 405 || response.status === 403){
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


export async function twoFAStatus() {
        try {
            const response = await fetch("/api/get_2fa_status/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
			if (!response.ok) {
				if (response.status === 401 || response.status === 405){
					const errorData = await response.json
					console.error(errorData.error)
					handle401Error();
					return;
				}
				else{
					throw new Error("Fetching twoFA failed");
				}
			}
			else{
				const responeData = await response.json();
				if (responeData.enable === true) {
					return true;
					} else {
					return false;
				}
			}
        } catch (error) {
            console.error(error);
        }
	}



export function handleCheckbox() {
    const checkBox2FA = document.getElementById("checkBox2FA");
    if (checkBox2FA) {
        checkBox2FA.onchange = function () {
            if (checkBox2FA.checked) {
                activatetwoFA();
            } else {
                deactivatetwoFA();
            }
        };
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


async function validateOTP() {
    try {
        const otp = document.getElementById("otpInput").value;
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("access_token");

        const response = await fetch("/api/validate_otp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ otp: otp }),
        });

		if (response.status === 401 || response.status === 405 || response.status === 403){
			const errorData = await response.json
			console.error(errorData.error)
			handle401Error();
			return;
        }

        const data = await response.json();

        if (data.valid) {
			handleRouteToken("/home/");
            const username = await getUsername();
            showLoggedInState(username);
			await loadFriends();
			await updateFriendDropdown();
        } else {
            alert("Validation failed: Invalid OTP");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while validating the OTP");
    }
}

export function generateQRCode() {
    const qrcodeButton = document.getElementById("generateQRCode");
    if (qrcodeButton) {
        qrcodeButton.onclick = async function (event) {
            event.preventDefault();
            try {
                const token = localStorage.getItem("access_token");
                const response = await fetch("/api/setup_2fa", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

				if (response.status === 401 || response.status === 405){
					const errorData = await response.json
					console.error(errorData.error)
					handle401Error();
					return;
				}
                const responseText = await response.text();
                const data = JSON.parse(responseText);
                const qrCodeImg = document.getElementById("qrcode");
                qrCodeImg.src = "data:image/png;base64," + data.qr_code;
            } catch (error) {
                console.log("Error:", error);
            }
        };
    }
}
