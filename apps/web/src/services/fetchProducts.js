export async function fetchProducts(token, page = 1, limit = 10, filters = {}) {
    const queryParams = new URLSearchParams({ page, limit, filters: JSON.stringify(filters) }).toString();
    try {
        const products = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/product?${queryParams}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return products;

    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}