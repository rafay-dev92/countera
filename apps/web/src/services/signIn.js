export async function signIn(data){
    try {
        const user = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
       
        return user;

    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}