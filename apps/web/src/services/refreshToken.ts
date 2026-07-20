export async function refreshToken(token: string, refreshTokenValue: string): Promise<Response> {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token,
                "refresh-token": refreshTokenValue
            }
        });
       
        return response;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}

