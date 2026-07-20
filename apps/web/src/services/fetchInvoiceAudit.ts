import type { InvoiceAudit } from "@/types/api";

/** The route wraps the rows in an envelope; callers read status/data/message. */
export interface InvoiceAuditResponse {
    status: number;
    data: InvoiceAudit[];
    message?: string;
}

export async function fetchInvoiceAudits(id: string, token: string): Promise<InvoiceAuditResponse | undefined> {
    try {
        const invoice = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invoice/audit/${id}`, {
            method: "GET",
            headers: {
                "auth-token": token
            }
        })
       
        return await invoice.json();

    } catch (error) {
        console.log(error);
    }
}