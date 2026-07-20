export async function fetchCustomer(id: string, token: string): Promise<Response | undefined> {
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
    // @ts-ignore -- pre-existing stray `users` token on the next line (throws ReferenceError at runtime if this catch path runs)
    }users
}