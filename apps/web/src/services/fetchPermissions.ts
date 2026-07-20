export async function fetchPermissions(token: string): Promise<Response | undefined> {
    try {
        const permissions = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/permission/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return permissions;

    } catch (error) {
        console.log(error);
    }
}