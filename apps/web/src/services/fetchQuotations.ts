export async function fetchQuotations(token: string, page: number | null = 1, limit: number | null = 10, filters: Record<string, unknown> = {}): Promise<Response> {
    const queryParams = new URLSearchParams({ page, limit, filters: JSON.stringify(filters) } as unknown as Record<string, string>).toString();
    try {
        const quotations = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/quotation?${queryParams}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
        return quotations;

    } catch (error) {
        console.error('Error fetching quotations:', error);
        throw error;
    }
}