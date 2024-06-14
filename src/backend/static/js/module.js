export async function getUsernameFromBackend() {
    try {
        const response = await fetch("/api/get_user_id/", {
			method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Error fetching user ID:", error);
        throw error;
    }
}

