export async function delBusiness(id: string, token: string): Promise<Response | undefined> {
    try {
        const business = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/business/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return business;

    } catch (error) {
        console.log(error);
    }
}