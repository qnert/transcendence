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

async function createTournament(tournamentName) {
    const URL = "/create-tournament/";
    try {
        const response = await fetch(URL, {
            method: "POST",
            body: JSON.stringify({ tournament_name: tournamentName }),
            headers: {
                "Content-Type": "application/json",
            },
        });
        // Handle status codes with 2xx as ok
        if (response.ok) {
            const processedResponse = await response.json();
            document.getElementById("newContent").innerHTML =
                "<h2>Tournament Created Successfully!</h2>";
        } else {
            errorResponse = await response.json();
            alert(errorResponse.error);
        }
    } catch (error) {
        alert("An error occurred. Please try again later.");
    }
}
