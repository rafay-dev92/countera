export async function updateAppointment(id, data, token){
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