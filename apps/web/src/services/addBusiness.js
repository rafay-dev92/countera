export async function addBusiness(data, token){
    try {
        const business = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/business/create`, {
            method: "POST",
            headers: {
                "auth-token": token
            },
            body: data
        })
       
        return business;

    } catch (error) {
        console.log(error);
    }
}