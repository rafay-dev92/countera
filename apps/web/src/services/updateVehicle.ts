import type { Vehicle } from "@/types/api";

export async function updateVehicle(id: string, data: Partial<Vehicle>, token: string): Promise<Response | undefined> {
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