export async function fetchMonthlySales(token) {
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