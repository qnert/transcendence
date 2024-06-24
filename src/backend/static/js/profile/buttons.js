import { handle401Error, handleRoute, updateContentToken } from "../basics.js";
import { fetchProfileData } from "./fetch_profile.js";
import { getCookie } from "../security/csrft.js";
import { checkBox } from "./2FA.js";
import { getAccessToken } from "../security/jwt.js";

export async function saveChanges() {
    const picture_url = document.getElementById("profile-picture_url").value;
    const display_name = document.getElementById("profile-display_name").value;
	if (display_name.length < 1 || display_name.trim() === ""){
		alert("display name must be atleast 1 character long");
		return;
	}
    const csrftoken = getCookie("csrftoken");
    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch("/api/save_changes/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ display_name: display_name, picture_url: picture_url }),
        });
        if (!response.ok) {
			if(response.status === 401){
				handle401Error();
				return;
			}
            const errorData = await response.json();
            alert(errorData.error);
        } else {
            alert("Settings got changed");
            fetchProfileData();
        }
    } catch (error) {
        console.error("Something went wrong:", error);
    }
}

export function bindSaveChangesButton() {
    const saveChangesButton = document.getElementById("saveChangesButton");
    if (saveChangesButton) {
        saveChangesButton.onclick = function (event) {
            event.preventDefault();
            saveChanges();
        };
    }
}

export async function bindProfileButton() {
    const profileButton = document.getElementById("profile");
    if (profileButton) {
        profileButton.onclick = async (event) => {
            event.preventDefault()
            await handleRoute("/profile/");
            await fetchProfileData();
        };
    }
}

export async function matchHistoryButton(){
	const matchHistory = document.getElementById("matchHistory");
	if(matchHistory){
		matchHistory.onclick = async function(event){
			event.preventDefault();
			await handleRoute("/history/");
			await getGameHistory();
		}
	}
}

export async function getGameHistory(){
	const token = localStorage.getItem("access_token");
	try {
        const response = await fetch("/game_history/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
			if(response.status === 401){
				handle401Error();
				return;
			}
            const errorData = await response.json();
            alert(errorData.error);
        } else {
			const data = await response.json();
            const historyTable = document.getElementById('history-body');
            historyTable.innerHTML = '';

            data.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${result.opponent_profile}</td>
                    <td>${result.user_score}</td>
                    <td>${result.opponent_score}</td>
                    <td>${result.is_win ? 'Win' : 'Loss'}</td>
                    <td>${result.date_played}</td>
                `;
                historyTable.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Something went wrong:", error);
    }
}

export async function pieChartButton(){
	const chart = document.getElementById("pieChart");
	if(chart){
		chart.onclick = async function(event){
			event.preventDefault();
			getChart("pie_chart");
		}
	}
}
export async function lineChartAvgButton(){
	const chart = document.getElementById("lineChartAvg");
	if(chart){
		chart.onclick = async function(event){
			event.preventDefault();
			getChart("line_chart_avg");
		}
	}
}
export async function lineChartMaxButton(){
	const chart = document.getElementById("lineChartMax");
	if(chart){
		chart.onclick = async function(event){
			event.preventDefault();
			getChart("line_chart_max");
		}
	}
}

export async function lineChartMinButton(){
	const chart = document.getElementById("lineChartMin");
	if(chart){
		chart.onclick = async function(event){
			event.preventDefault();
			getChart("line_chart_min");
		}
	}
}

async function getChart(path){
	const token = localStorage.getItem("access_token");
	try {
        const response = await fetch(`/${path}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
			if(response.status === 401){
				handle401Error();
				return;
			}
			if(response.status === 400){
				alert("No data given!");
				return;
			}
			return ;
        } else {
			const chart = document.getElementById('chart');
			if(chart)
				chart.innerHTML = "";
            const data = await response.json();
            if (data.success) {
                document.getElementById('chart').src = 'data:image/png;base64,' + data.success;
            }
		}
    } catch (error) {
        console.error("Something went wrong:", error);
    }
}


