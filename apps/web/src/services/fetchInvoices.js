export async function fetchInvoices(token, page = 1, limit = 10) {
    try {
        const invoices = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice?page=${page}&limit=${limit}`, {
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