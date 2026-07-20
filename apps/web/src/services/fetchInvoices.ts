export interface InvoiceListFilters {
    paymentStatus?: string[];
    startDate?: Date | string;
    endDate?: Date | string;
    isReport?: boolean;
    order?: string;
    [key: string]: unknown;
}

export async function fetchInvoices(token: string, page: number | null = 1, limit: number | null = 10, filters: InvoiceListFilters = {}): Promise<Response> {
    const queryParams = new URLSearchParams({ page, limit, filters: JSON.stringify(filters) } as unknown as Record<string, string>).toString();
    try {
        const invoices = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice?${queryParams}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return invoices;

    } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
    }
}