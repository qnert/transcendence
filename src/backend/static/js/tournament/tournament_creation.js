// TODO make this a global object / array
// sth usable like ...
// ... alert(`${msg.tournament.InvalidName}`)
const msgFormInfo = "Please enter a Tournament Name!";
const msgInvalidName = "Invalid tournament name!";
const msgFailedLoad = "Failed to load the Tournament Lobby!";
const msgFetchError = "An error occured. Please try again later!";

async function get_tournaments() {
    const fetchTournamentsURL = "/tournament/api/get_list";
    const fetchTournamentsResponse = await fetch(fetchTournamentsURL, {
        method: "GET",
    });

    const tournaments = await fetchTournamentsResponse.json();
    console.log(tournaments);

    const tournamentListElement = document.getElementById("join-field-list");
    tournamentListElement.innerHTML = ""; // Clear any existing content
    const firstItem = document.createElement("option");
    firstItem.disabled = true;
    firstItem.selected = true;
    firstItem.value = "";
    firstItem.textContent = "";
    tournamentListElement.appendChild(firstItem);
    tournaments.forEach((tournament) => {
        const listItem = document.createElement("option");
        listItem.textContent = tournament.name;
        tournamentListElement.appendChild(listItem);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    get_tournaments();
    const form = document.getElementById("tournament-form");
    const tournamentNameField = document.getElementById(
        "tournament-form-name-field"
    );

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const tournamentName = tournamentNameField.value;
        // @note might change this to better UX
        if (!tournamentName) {
            alert(`${msgFormInfo}`);
        } else if (/^(?=.*[a-zA-Z])[a-zA-Z0-9_-] +$/.test(tournamentName)) {
            createTournament(tournamentName);
        } else {
            alert(`${msgInvalidName}`);
        }
    });

    const joinGroup = document.getElementById("join-field-group");
    joinGroup.addEventListener("submit", function (event) {
        event.preventDefault();
    });
});

async function joinTournament(tournamentName) {
    const joinURL = `/tournament /${tournamentName}`;
    const response = await fetch(lobbyURL, {
        method: "GET",
    });
    console.log(response);
}

// @ note abstract code a little
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
        if (response.ok) {
            // @note do i even need the processedResponse?
            const processedResponse = await response.json();

            const lobbyURL = `/tournament /${tournamentName} /`;
            const lobbyResponse = await fetch(lobbyURL, {
                method: "GET",
            });

            if (lobbyResponse.ok) {
                const lobbyHTML = await lobbyResponse.text();
                document.getElementById("newContent").innerHTML = lobbyHTML;
                const newURL = `/tournament /${tournamentName} /`;
                history.pushState({ path: newURL }, "", newURL);
                window.initializeLobby();
            } else {
                alert(`${msgFailedLoad}`);
            }
        } else {
            errorResponse = await response.json();
            alert(errorResponse.error);
        }
    } catch (error) {
        alert(`${msgFetchError}`);
    }
}
