export async function delArchivedInvoice(id, token){
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/archived-invoice/delete/${id}`, {
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