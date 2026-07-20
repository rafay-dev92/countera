export async function fetchProductsCategories(token: string): Promise<Response | undefined> {
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
    // @ts-ignore -- pre-existing stray `users` token on the next line (throws ReferenceError at runtime if this catch path runs)
    }users
}