export async function delPermission(id, token){
    try {
        const permission = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/permission/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return permission;

    } catch (error) {
        console.log( error);    
    }
}