export async function updateProductCategory(id, data, token){
    try {
        const category = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productcategories/update/${id}`, {
            method: "PUT",
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