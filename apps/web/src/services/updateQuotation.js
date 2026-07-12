export async function updateQuotation(id, data, token){
    try {
        const quotation = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/quotation/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return quotation;

    } catch (error) {
        console.log(error);
    }
}