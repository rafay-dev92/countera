export async function updateInvoice(id, data, token){
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return invoice;

    } catch (error) {
        console.log(error);
    }
}