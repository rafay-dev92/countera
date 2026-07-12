export async function fetchTaxes(token){
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