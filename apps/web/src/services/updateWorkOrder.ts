export async function updateWorkOrder(id: string, data: Record<string, unknown>, token: string): Promise<Response | undefined> {
    try {
        const workorder = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/workorder/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return workorder;

    } catch (error) {
        console.log(error);
    }
}