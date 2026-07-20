export async function fetchProducts(token: string): Promise<Response> {
    try {
        const products = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/product`, {
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