export async function delPackage(id: string, token: string): Promise<Response | undefined> {
    try {
        const productsPackage = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/package/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return productsPackage;

    } catch (error) {
        console.log(error);
    }
}