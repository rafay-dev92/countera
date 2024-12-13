export async function addAppointment(data, token){
    try {
        const tax = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointment/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return tax;

    } catch (error) {
        console.log(error);
    }
}