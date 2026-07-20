import type { Customer } from "@/types/api";

export async function updateCustomer(id: string, data: Partial<Customer>, token: string): Promise<Response | undefined> {
    try {
        const customer = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return customer;

    } catch (error) {
        console.log(error);
    }
}