export async function addVehicle(data, token){
    try {
        const vehicle = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicle/create`, {
            method: "POST",
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