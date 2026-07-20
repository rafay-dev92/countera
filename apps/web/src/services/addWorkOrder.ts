export async function addWorkOrder(data: Record<string, unknown>, token: string): Promise<Response | undefined> {
    try {
        const workorder = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/workorder/create`, {
            method: "POST",
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