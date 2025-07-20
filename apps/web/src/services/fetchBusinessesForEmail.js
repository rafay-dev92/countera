export async function fetchBusinessesForEmail(email) {
    try {
        const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/businesses-for-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
       
        return data;

    } catch (error) {
        console.log(error);
    }
}