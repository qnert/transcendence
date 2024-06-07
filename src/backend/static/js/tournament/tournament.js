async function createTournament() {
    const URL = "/create-tournament/";
    const promise = await fetch(URL, {
        method: "POST",
        body: JSON.stringify({ tournament_name: "tournament1" }),
    });
    const processedResponse = await promise.json();
    console.log(processedResponse);
}
