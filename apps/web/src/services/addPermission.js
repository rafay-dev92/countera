export async function addPermission(data, token){
    try {
        const permission = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/permission/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return permission;

    } catch (error) {
        console.log(error);
    }
}