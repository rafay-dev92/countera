export async function updateBusiness(id, data, token){
    try {
        const business = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/business/update/${id}`, {
            method: "PUT",
            headers: {
                // "Content-Type": "application/json",
                "auth-token": token
            },
            body: data
        })
       
        return business;

    } catch (error) {
        console.log(error);
    }
}