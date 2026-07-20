export async function updatePackage(id: string, data: Record<string, unknown>, token: string): Promise<Response | undefined> {
    try {
        const updatePackage = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/package/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return updatePackage;

    } catch (error) {
        console.log(error);
    }
}