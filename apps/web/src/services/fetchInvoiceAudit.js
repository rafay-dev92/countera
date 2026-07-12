export async function fetchInvoiceAudits(id, token){
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/audit/${id}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return await invoice.json();

    } catch (error) {
        console.log(error);
    }
}