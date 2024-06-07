const URL = "/create-tournament/";
async function createTournament() {
    console.log("Creating Tournament");

    const promise = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({user: "some_username", tournament_name: "tournament1"}),
    });
    console.log(promise);
    const processedResponse = await promise.json();
    console.log(processedResponse);
}
