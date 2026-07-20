import type { CustomerVehicle } from "@/types/api";

export async function addCustomerVehicle(data: Partial<CustomerVehicle>, token: string): Promise<Response | undefined> {
    try {
        const customerVehicle = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customervehicle/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return customerVehicle;

    } catch (error) {
        console.log(error);
    }
}