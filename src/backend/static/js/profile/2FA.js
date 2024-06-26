import { checkAccessToken } from "../profile/profile.js";
import { handle401Error, handleRouteToken } from "../basics.js";
import { getCookie } from "../security/csrft.js";

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

export function validateOTP() {
    const validateButton = document.getElementById("validateOTP");
    if (validateButton) {
        validateButton.addEventListener("click", function (event) {
            event.preventDefault();
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
                    checkAccessToken();
                    handleRouteToken("/home/");
                } else {
                    alert("Validation failed: Invalid OTP");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("An error occurred while validating the OTP");
            });
        });
    }
}

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
