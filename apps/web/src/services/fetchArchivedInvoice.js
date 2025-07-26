export async function fetchArchivedInvoice(id, token){
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/archived-invoice/${id}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return invoice;

    } catch (error) {
        console.log(error);
    }
}