export async function fetchInvoices(token, page = 1, limit = 10, filters = {}) {
    const queryParams = new URLSearchParams({ page, limit, filters: JSON.stringify(filters) }).toString();
    try {
        const invoices = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice?${queryParams}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return invoices;

    } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
    }
}