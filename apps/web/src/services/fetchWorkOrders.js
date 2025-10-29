export async function fetchWorkOrders(token, page = 1, limit = 10, filters = {}) {
    const queryParams = new URLSearchParams({ page, limit, filters: JSON.stringify(filters) }).toString();
    try {
        const workorders = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/workorder?${queryParams}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
        return workorders;

    } catch (error) {
        console.error('Error fetching work orders:', error);
        throw error;
    }
}