export async function fetchBusinesses(token: string): Promise<Response | undefined> {
    try {
        const businesses = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/business/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return businesses;

    } catch (error) {
        console.log(error);
    }
}