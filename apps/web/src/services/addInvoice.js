export async function addInvoice(data, token){
    console.log(data);
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return invoice;

    } catch (error) {
        console.log(error);
    }
}