export async function delInvoice(id: string, token: string): Promise<Response | undefined> {
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return invoice;

    } catch (error) {
        console.log(error);
    }
}