export async function updateUser(id, data, token){
    try {
        const user = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return user;

    } catch (error) {
        console.log(error);
    }
}