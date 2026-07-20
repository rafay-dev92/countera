import type { Inspection } from "@/types/api";

export async function addInspection(data: Partial<Inspection>, token: string): Promise<Response | undefined> {
    try {
        const inspection = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/inspection/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return inspection;

    } catch (error) {
        console.log(error);
    }
}