import type { ProductCategory } from "@/types/api";

export async function addProductCategory(data: Partial<ProductCategory>, token: string): Promise<Response | undefined> {
    try {
        const category = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productcategories/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return category;

    } catch (error) {
        console.log(error);
    }
}