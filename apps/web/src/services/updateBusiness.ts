export async function updateBusiness(id: string, data: FormData, token: string): Promise<Response | undefined> {
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