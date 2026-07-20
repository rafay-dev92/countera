import type { ProductCategory } from "@/types/api";

export async function updateProductCategory(id: string, data: Partial<ProductCategory>, token: string): Promise<Response | undefined> {
    try {
        const category = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productcategories/update/${id}`, {
            method: "PUT",
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