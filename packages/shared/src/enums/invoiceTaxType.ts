export const InvoiceTaxType = {
  Percentage: "%",
  Fixed: "$",
} as const;

export type InvoiceTaxType = (typeof InvoiceTaxType)[keyof typeof InvoiceTaxType];
