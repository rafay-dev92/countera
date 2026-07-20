export async function updateProduct(id: string, data: FormData, token: string): Promise<Response | undefined> {
    try {
        const product = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/product/update/${id}`, {
            method: "PUT",
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