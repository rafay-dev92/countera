export async function fetchBusinesses(token){
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