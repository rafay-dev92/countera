export async function fetchTaxes(token: string): Promise<Response | undefined> {
    try {
        const taxes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tax/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return taxes;

    } catch (error) {
        console.log(error);
    }
}