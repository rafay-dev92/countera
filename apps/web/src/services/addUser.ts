export async function addUser(data: Record<string, unknown>, token: string): Promise<Response | undefined> {
    try {
        const user = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/signup`, {
            method: "POST",
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