export async function fetchBusinessesForEmail(email: string, captcha: string): Promise<Response> {
    try {
        const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/businesses-for-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, captcha })
        })
        
        return data;
    } catch (error) {
        console.error('Error fetching businesses for email:', error);
        throw error;
    }
}