import type { Tax } from "@/types/api";

export async function updateTax(id: string, data: Partial<Tax>, token: string): Promise<Response | undefined> {
    try {
        const tax = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tax/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return tax;

    } catch (error) {
        console.log(error);
    }
}