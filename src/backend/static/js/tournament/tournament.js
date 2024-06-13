const tournamentLobbySocket = new WebSocket(`ws://${window.location.host}/ws/socket-server/`)

tournamentLobbySocket.onmessage = function(e){
    let data = JSON.parse(e.data);
    console.log('Data:', data);
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("tournament-form");
    const tournamentNameField = document.getElementById(
        "tournament-form-name-field"
    );
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const tournamentName = tournamentNameField.value;

        // @note might change this to better UX
        if (!tournamentName) {
            alert("Please enter a Tournament Name!");
        } else if (/^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/.test(tournamentName)) {
            createTournament(tournamentName);
        } else {
            alert(
                "Invalid tournament name. Only a-z A-Z 0-9 _ - are allowed, and it must contain at least one letter."
            );
        }
    });
});

// @note abstract code a little
async function createTournament(tournamentName) {
    const createURL = "/tournament/api/create/";
    try {
        const response = await fetch(createURL, {
            method: "POST",
            body: JSON.stringify({ tournament_name: tournamentName }),
            headers: {
                "Content-Type": "application/json",
            },
        });
        // Handle status codes with 2xx as ok
        if (response.ok) {
            // @note do i even need the processedResponse?
            const processedResponse = await response.json();

            const lobbyURL = "/tournament/lobby/";
            const lobbyResponse = await fetch(lobbyURL, {
                method: "GET",
            });

            if (lobbyResponse.ok) {
                const lobbyHTML = await lobbyResponse.text();
                document.getElementById("newContent").innerHTML = lobbyHTML;
                const newURL = "/tournament/lobby/";
                history.pushState({ path: newURL }, "", newURL);
            } else {
                alert("Failed to load the tournament lobby.");
            }
        } else {
            errorResponse = await response.json();
            alert(errorResponse.error);
        }
    } catch (error) {
        alert("An error occurred. Please try again later.");
    }
}
