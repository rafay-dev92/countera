export const PaymentStatus = {
  PAID: "PAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  UNPAID: "UNPAID",
  VOIDED: "VOIDED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// The API historically calls this same value set InvoicePaymentStatus.
export const InvoicePaymentStatus = PaymentStatus;

export type InvoicePaymentStatus = PaymentStatus;
