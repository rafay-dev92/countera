import type { Permission } from "@/types/api";

export async function updatePermission(id: string, data: Partial<Permission>, token: string): Promise<Response | undefined> {
    try {
        const permission = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/permission/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return permission;
        
    } catch (error) {
        console.log(error);
    }
}