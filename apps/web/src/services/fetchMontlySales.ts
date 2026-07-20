export async function fetchMonthlySales(token: string): Promise<Response | undefined> {
    try {
        const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sales/monthly`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return data;

    } catch (error) {
        console.log(error);
    }
}