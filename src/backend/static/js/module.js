export async function getUsernameFromBackend() {
	const token = localStorage.getItem("access_token");
	try {
		const response = await fetch('/api/get_user_id/', {
		  headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`,
		  }
		});
		const data = await response.json();
		return data.id;
	} catch (error) {
		console.error('Error fetching user ID:', error);
		throw error;
	}
  }
  