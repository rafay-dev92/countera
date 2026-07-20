export async function fetchAppointments(token: string): Promise<Response | undefined> {
    try {
        const appointments = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointment/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return appointments;

    } catch (error) {
        console.log(error);
    }
}