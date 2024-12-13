export async function addTax(data, token){
    try {
        const tax = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tax/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return tax;

    } catch (error) {
        console.log(error);
    }
}