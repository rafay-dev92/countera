export async function fetchWorkOrders(token){
    try {
        const workorders = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/workorder/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
        return workorders;

    } catch (error) {
        console.log(error);
    }
}