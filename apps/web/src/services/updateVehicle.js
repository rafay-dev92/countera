export async function updateVehicle(id, data, token){
    try {
        console.log(data);
        const vehicle = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicle/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return vehicle;

    } catch (error) {
        console.log(error);
    }
}