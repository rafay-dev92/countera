export async function fetchBusiness(id, token){
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