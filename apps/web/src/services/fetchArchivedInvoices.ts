export async function fetchArchivedInvoices(token: string): Promise<Response | undefined> {
    try {
        const invoices = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/archived-invoice`, {
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