export async function fetchProductsCategories(token){
    try {
        const products = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productcategories/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return products;

    } catch (error) {
        console.log(error);
    }users
}