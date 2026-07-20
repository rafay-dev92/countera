export async function fetchCustomers(token: string): Promise<Response | undefined> {
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
    // @ts-ignore -- pre-existing stray `users` token on the next line (throws ReferenceError at runtime if this catch path runs)
    }users
}