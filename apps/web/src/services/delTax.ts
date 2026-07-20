export async function delTax(id: string, token: string): Promise<Response | undefined> {
    try {
        const tax = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tax/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return tax;

    } catch (error) {
        console.log(error);
    }
}