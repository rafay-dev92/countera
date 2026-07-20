import type { Customer } from "@/types/api";

export async function addCustomer(data: Partial<Customer>, token: string): Promise<Response | undefined> {
    try {
        const customer = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/create`, {
            method: "POST",
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