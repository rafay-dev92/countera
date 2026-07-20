/**
 * Entity types for API payloads, derived from apps/api/db/schema.ts.
 * Relation keys use the Sequelize-era association aliases the REST routes
 * still emit (Customer, CustomerVehicle, Payments, Taxes, ...).
 * Timestamps arrive as ISO strings over JSON.
 */
import type {
  InvoicePaymentStatus,
  WorkOrderStatus,
  InvoiceTaxType,
  UserRole,
} from "@countera/shared";

export interface Business {
  id: string;
  name: string;
  email: string | null;
  logo: string | null;
  address: string;
  city: string;
  state: string;
  zipcode: number;
  timezone: string | null;
  licenseNumber: string | null;
  permitNumber: string | null;
  tel: string;
  fax: string | null;
  defaultMargin: number | null;
  termsAndConditions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  dob: string | null;
  BusinessId: string | null;
  Business?: Business | null;
  Permission?: Permission[];
  createdAt: string;
  updatedAt: string;
}

/** Shape kept in app state after the layout flattens permission names. */
export interface SessionUser extends Omit<ApiUser, "Permission"> {
  Permission: string[];
  isSuperAdmin?: boolean;
}

export interface Address {
  id: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zipcode: number | null;
  CustomerId: string;
}

export interface CustomerVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  engineSize: string | null;
  licenseNo: string | null;
  vinNo: string | null;
  color: string | null;
  notes: string | null;
  CustomerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  customerType: string;
  email: string | null;
  phone: string | null;
  licenseNo: string | null;
  notes: string | null;
  taxable: boolean;
  isActive: boolean;
  BusinessId: string;
  Address?: Address | null;
  Vehicle?: CustomerVehicle[];
  Business?: Business | null;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string | null;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  sendEmail: boolean;
  BusinessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  name: string;
  type: string;
  rate: number;
  default: boolean;
  BusinessId: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  BusinessId: string;
}

/** Join-row payload attached to products inside document responses. */
export interface ProductLineJoin {
  quantity: number;
  description: string | null;
  price: number;
  replacement_reminder_date?: string | null;
}

export interface Product {
  id: string;
  name: string;
  image: string | null;
  margin: number | null;
  price: number;
  description: string | null;
  cost: number | null;
  itemCode: string | null;
  type: string;
  taxable: boolean;
  CategoryId: string | null;
  BusinessId: string;
  Category?: ProductCategory | null;
  Taxes?: Tax[];
  /** present when the product arrives inside an invoice/quotation/workorder */
  Invoice_Product?: ProductLineJoin;
  Quotation_Product?: ProductLineJoin;
  WorkOrder_Product?: ProductLineJoin;
  Package_Product?: { quantity: number };
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTax {
  id: string;
  InvoiceId: string;
  ProductId: string;
  TaxId: string;
  tax_name: string | null;
  tax_rate: number;
  tax_type: InvoiceTaxType;
  tax_amount: number;
  description: string | null;
}

export interface Payment {
  id: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  cardNumber: string | null;
  InvoiceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: number;
  totalAmount: number;
  discount: number;
  labour: number;
  paymentStatus: InvoicePaymentStatus;
  paidAmount: number;
  isArchived: boolean;
  notes: string | null;
  comments: string | null;
  manufactureWarranty: boolean;
  roadHazardWarranty: boolean;
  flatRepairWarranty: boolean;
  rotationWarranty: boolean;
  noWarranty: boolean;
  balanceWarranty: boolean;
  CustomerId: string;
  CustomerVehicleId: string;
  BusinessId: string;
  Customer: Customer;
  CustomerVehicle: CustomerVehicle;
  Business?: Business | null;
  Payments?: Payment[];
  Taxes?: InvoiceTax[];
  Products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: number;
  totalAmount: number;
  discount: number;
  labour: number;
  approved: boolean;
  notes: string | null;
  comments: string | null;
  appliedTaxes: unknown;
  CustomerId: string;
  CustomerVehicleId: string;
  BusinessId: string;
  Customer: Customer;
  CustomerVehicle: CustomerVehicle;
  Products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: number;
  totalAmount: number;
  discount: number;
  labour: number;
  status: WorkOrderStatus;
  notes: string | null;
  comments: string | null;
  appliedTaxes: unknown;
  CustomerId: string;
  CustomerVehicleId: string;
  BusinessId: string;
  Customer: Customer;
  CustomerVehicle: CustomerVehicle;
  Products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceAudit {
  id: string;
  invoiceId: string;
  userId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  timestamp: string | null;
  User?: ApiUser;
}

export interface ArchivedInvoice {
  id: string;
  originalInvoiceId: string;
  invoiceNumber: number;
  totalAmount: number;
  discount: number;
  paymentStatus: string;
  paidAmount: number;
  notes: string | null;
  comments: string | null;
  manufactureWarranty: boolean;
  roadHazardWarranty: boolean;
  flatRepairWarranty: boolean;
  rotationWarranty: boolean;
  noWarranty: boolean;
  balanceWarranty: boolean;
  payments: string;
  CustomerId: string;
  CustomerVehicleId: string;
  BusinessId: string;
  Customer?: Customer;
  CustomerVehicle?: CustomerVehicle;
  Products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  BusinessId: string;
  Products?: Product[];
}

export interface Inspection {
  id: string;
  data: unknown;
  CustomerId: string;
  CustomerVehicleId: string | null;
  Customer?: Customer;
  CustomerVehicle?: CustomerVehicle | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
}

export interface Reminder {
  Invoice?: Invoice & { Customer?: Customer & { Business?: Business } };
  Product?: Product;
}

/** Paginated list envelope used by fetchInvoices and friends. */
export interface Paginated<T> {
  data: T[];
  total: number;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
  sessionExpire: number;
}
