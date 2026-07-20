import type { Address } from "@/types/api";

export async function updateAddress(id: string, data: Partial<Address>, token: string): Promise<Response | undefined> {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/address/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return res;

    } catch (error) {
        console.log(error);
    }
}