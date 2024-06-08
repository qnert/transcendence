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
    const promise = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({ tournament_name: tournamentName }),
    });
    const processedResponse = await promise.json();

    // @note remove
    console.log(processedResponse);
}
