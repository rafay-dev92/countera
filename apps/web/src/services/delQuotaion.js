export async function delQuotation(id, token){
    try {
        const quotation = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/quotation/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return quotation;

    } catch (error) {
        console.log(error);
    }
}