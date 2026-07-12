export async function getUserDetails(token){
    try {
        const userInfo = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/getuser`, {
            method: "POST",
            headers: {
                "auth-token": token
            }
        })
        
        return userInfo;

    } catch (error) {
        return error;
    }
}