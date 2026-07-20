export async function fetchUsers(token: string): Promise<Response | undefined> {
    try {
        const users = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return users;

    } catch (error) {
        console.log(error);
    }
}