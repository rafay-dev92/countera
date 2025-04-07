export async function addProductCategory(data, token){
    try {
        const category = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productcategories/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
            body: JSON.stringify(data)
        })
       
        return category;

    } catch (error) {
        console.log(error);
    }
}