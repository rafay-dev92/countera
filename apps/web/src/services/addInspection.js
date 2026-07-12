export async function addInspection(data, token){
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