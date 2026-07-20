export async function fetchBusiness(id: string, token: string): Promise<Response | undefined> {
    try {
        const business = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/business/${id}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return business;

    } catch (error) {
        console.log(error);
    }
}