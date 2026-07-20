export async function fetchDailyAppointments(token: string): Promise<Response | undefined> {
    try {
        const appointments = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointment/today`, {
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