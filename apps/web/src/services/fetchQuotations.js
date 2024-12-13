export async function fetchQuotations(token){
    try {
        const quotations = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/quotation/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
        return quotations;

    } catch (error) {
        console.log(error);
    }users
}