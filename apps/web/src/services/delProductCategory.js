export async function delProductCategory(id, token){
    try {
        const category = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productcategories/delete/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "auth-token": token
            },
        })
       
        return category;

    } catch (error) {
        console.log(error);
    }
}