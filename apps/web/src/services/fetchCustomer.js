export async function fetchCustomer(id, token){
    try {
        const customer = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/${id}`, {
            method: "GET",
            headers: {
                "auth-token": token
            },
        })
        return customer;

    } catch (error) {
        console.log(error);
    }users
}