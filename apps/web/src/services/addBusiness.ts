export async function addBusiness(data: FormData, token: string): Promise<Response | undefined> {
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