import type { Appointment } from "@/types/api";

export async function updateAppointment(id: string, data: Partial<Appointment>, token: string): Promise<Response | undefined> {
    try {
        const appointment = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointment/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return appointment;

    } catch (error) {
        console.log(error);
    }
}