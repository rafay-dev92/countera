export async function fetchCustomers(token){
    try {
        const customers = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/`, {
            method: "GET",
            headers: {
                "auth-token": token
            },
        })
        return customers;

    } catch (error) {
        console.log(error);
    }users
}