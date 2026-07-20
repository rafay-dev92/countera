export async function delUser(id: string, token: string): Promise<Response | undefined> {
    try {
        const user = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return user;

    } catch (error) {
        console.log(error);
    }
}