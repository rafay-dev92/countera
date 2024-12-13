export async function fetchInvoices(token){
    try {
        const invoices = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return invoices;

    } catch (error) {
        console.log(error);
    }
}