export async function delCustomer(id, token){
    try {
        const customer = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return customer;

    } catch (error) {
        console.log( error);    
    }
}