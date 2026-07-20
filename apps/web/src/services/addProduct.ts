export async function addProduct(data: FormData, token: string): Promise<Response | undefined> {
    try {
        const product = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/product/create`, {
            method: "POST",
            headers: {
                // "Content-Type": "application/json",
                "auth-token": token
            },
            body: data
        })
       
        return product;

    } catch (error) {
        console.log(error);
    }
}