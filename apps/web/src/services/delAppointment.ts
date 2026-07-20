export async function delAppointment(id: string, token: string): Promise<Response | undefined> {
    try {
        const appointment = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointment/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return appointment;

    } catch (error) {
        console.log(error);
    }
}