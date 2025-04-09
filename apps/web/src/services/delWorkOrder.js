export async function delWorkOrder(id, token){
    try {
        const workorder = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/workorder/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return workorder;

    } catch (error) {
        console.log(error);
    }
}