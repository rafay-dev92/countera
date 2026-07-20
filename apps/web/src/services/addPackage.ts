export async function addPackage(data: Record<string, unknown>, token: string): Promise<Response | undefined> {
    try {
        const productsPackage = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/package/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return productsPackage;

    } catch (error) {
        console.log(error);
    }
}