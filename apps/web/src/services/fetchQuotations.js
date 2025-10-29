export async function fetchQuotations(token, page = 1, limit = 10, filters = {}) {
    const queryParams = new URLSearchParams({ page, limit, filters: JSON.stringify(filters) }).toString();
    try {
        const quotations = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/quotation?${queryParams}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
        return quotations;

    } catch (error) {
        console.error('Error fetching quotations:', error);
        throw error;
    }
}