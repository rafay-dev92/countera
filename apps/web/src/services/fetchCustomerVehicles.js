export async function fetchCustomerVehicles(customerId, token){
    try {
        const customerVehicles = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customervehicle/customer/${customerId}`, {
            method: "GET",
            headers: {
                "auth-token": token
            },
        })
        return customerVehicles;

    } catch (error) {
        console.log(error);
    }
}