export async function fetchPackages(token){
    try {
        const packages = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/package/`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
        
        return packages;

    } catch (error) {
        console.log(error);
    }
}