export async function fetchInvoice(id: string, token: string): Promise<Response | undefined> {
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/${id}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return invoice;

    } catch (error) {
        console.log(error);
    }
}