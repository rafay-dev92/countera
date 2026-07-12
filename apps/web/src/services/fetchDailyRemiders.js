export async function fetchDailyReminders(token, businessId) {
    try {
        const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/today-reminders/${businessId}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return data;

    } catch (error) {
        console.log(error);
    }
}