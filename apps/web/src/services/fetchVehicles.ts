export async function fetchVehicles(token: string): Promise<Response | undefined> {
    try {
        const vehicles = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vehicle/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return vehicles;

    } catch (error) {
        console.log(error);
    }
}