export async function delCustomerVehicle(id: string, token: string): Promise<Response | undefined> {
    try {
        const customerVehicle = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customervehicle/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return customerVehicle;

    } catch (error) {
        console.log( error);    
    }
}