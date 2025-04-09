export async function softDelInvoice(id, status, token){
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/delete/${id}/${status}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return invoice;

    } catch (error) {
        console.log(error);
    }
}