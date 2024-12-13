export async function updateAddress(id, data, token){
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/address/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return res;

    } catch (error) {
        console.log(error);
    }
}