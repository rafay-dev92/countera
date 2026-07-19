import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  json,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "USER",
  "MANAGER",
  "CASHIER",
  "SALESMAN",
]);

export const invoicePaymentStatusEnum = pgEnum("invoice_payment_status", [
  "PAID",
  "PARTIALLY_PAID",
  "UNPAID",
  "VOIDED",
  "REFUNDED",
]);

// The archive table predates the shared enum and uses VOID instead of VOIDED.
export const archivedInvoicePaymentStatusEnum = pgEnum(
  "archived_invoice_payment_status",
  ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED", "VOID"]
);

export const workOrderStatusEnum = pgEnum("workorder_status", [
  "PENDING",
  "FINISHED",
]);

export const invoiceTaxTypeEnum = pgEnum("invoice_tax_type", ["%", "$"]);

export const invoiceAuditChangeTypeEnum = pgEnum("invoice_audit_change_type", [
  "UPDATE",
  "ADD",
  "REMOVE",
  "UPDATE_ADD",
  "UPDATE_REMOVE",
  "ADD_REMOVE",
  "MULTIPLE",
]);

// ---------------------------------------------------------------------------
// Column helpers — Sequelize kept camelCase column names and PascalCase FK
// names; the property names below match the existing API payloads exactly.
// ---------------------------------------------------------------------------

const timestamps = {
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  logo: varchar("logo", { length: 255 }),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  zipcode: integer("zipcode").notNull(),
  timezone: varchar("timezone", { length: 255 }).default("America/Los_Angeles"),
  licenseNumber: varchar("licenseNumber", { length: 255 }),
  permitNumber: varchar("permitNumber", { length: 255 }),
  tel: varchar("tel", { length: 255 }).notNull(),
  fax: varchar("fax", { length: 255 }),
  defaultMargin: doublePrecision("defaultMargin"),
  termsAndConditions: text("termsAndConditions"),
  ...timestamps,
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  first_name: varchar("first_name", { length: 255 }).notNull(),
  last_name: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("USER").notNull(),
  phone: varchar("phone", { length: 255 }),
  dob: date("dob"),
  BusinessId: uuid("BusinessId").references(() => businesses.id, {
    onDelete: "restrict",
    onUpdate: "cascade",
  }),
  ...timestamps,
});

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  ...timestamps,
});

export const user_permission = pgTable(
  "user_permission",
  {
    UserId: uuid("UserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    PermissionId: uuid("PermissionId")
      .notNull()
      .references(() => permissions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.UserId, t.PermissionId] })]
);

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  customerType: varchar("customerType", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  licenseNo: varchar("licenseNo", { length: 255 }),
  notes: text("notes"),
  taxable: boolean("taxable").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 255 }),
  zipcode: integer("zipcode"),
  CustomerId: uuid("CustomerId")
    .notNull()
    .references(() => customers.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const customer_vehicles = pgTable("customer_vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  make: varchar("make", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  year: integer("year").notNull(),
  odometer: integer("odometer").notNull(),
  engineSize: varchar("engineSize", { length: 255 }),
  licenseNo: varchar("licenseNo", { length: 255 }),
  vinNo: varchar("vinNo", { length: 255 }),
  color: varchar("color", { length: 255 }),
  notes: text("notes"),
  CustomerId: uuid("CustomerId")
    .notNull()
    .references(() => customers.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 255 }),
  description: varchar("description", { length: 255 }),
  startDateTime: timestamp("startDateTime", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  endDateTime: timestamp("endDateTime", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  sendEmail: boolean("sendEmail").notNull(),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: integer("invoiceNumber").default(0).notNull(),
  totalAmount: doublePrecision("totalAmount").notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  labour: doublePrecision("labour").default(0).notNull(),
  paymentStatus: invoicePaymentStatusEnum("paymentStatus")
    .default("UNPAID")
    .notNull(),
  paidAmount: doublePrecision("paidAmount").default(0).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  notes: varchar("notes", { length: 255 }),
  comments: varchar("comments", { length: 255 }),
  manufactureWarranty: boolean("manufactureWarranty").default(false).notNull(),
  roadHazardWarranty: boolean("roadHazardWarranty").default(false).notNull(),
  flatRepairWarranty: boolean("flatRepairWarranty").default(false).notNull(),
  rotationWarranty: boolean("rotationWarranty").default(false).notNull(),
  noWarranty: boolean("noWarranty").default(false).notNull(),
  balanceWarranty: boolean("balanceWarranty").default(false).notNull(),
  CustomerId: uuid("CustomerId")
    .notNull()
    .references(() => customers.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  CustomerVehicleId: uuid("CustomerVehicleId")
    .notNull()
    .references(() => customer_vehicles.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const invoice_product = pgTable(
  "invoice_product",
  {
    quantity: integer("quantity").default(1).notNull(),
    description: varchar("description", { length: 255 }).default(""),
    price: doublePrecision("price").default(0).notNull(),
    replacement_reminder_date: timestamp("replacement_reminder_date", {
      withTimezone: true,
      mode: "date",
    }),
    ProductId: uuid("ProductId")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    InvoiceId: uuid("InvoiceId")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.ProductId, t.InvoiceId] })]
);

export const invoice_tax = pgTable("invoice_tax", {
  id: uuid("id").defaultRandom().primaryKey(),
  InvoiceId: uuid("InvoiceId")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  ProductId: uuid("ProductId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  TaxId: uuid("TaxId")
    .notNull()
    .references(() => taxes.id, { onDelete: "cascade" }),
  tax_name: varchar("tax_name", { length: 255 }).default(""),
  tax_rate: doublePrecision("tax_rate").default(0).notNull(),
  tax_type: invoiceTaxTypeEnum("tax_type").default("%").notNull(),
  tax_amount: doublePrecision("tax_amount").default(0).notNull(),
  description: varchar("description", { length: 255 }).default(""),
  ...timestamps,
});

export const invoice_audits = pgTable("invoice_audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoiceId")
    .notNull()
    .references(() => invoices.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  fieldName: varchar("fieldName", { length: 255 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  changeType: invoiceAuditChangeTypeEnum("changeType").notNull(),
  timestamp: timestamp("timestamp", {
    withTimezone: true,
    mode: "date",
  }).defaultNow(),
  ...timestamps,
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  totalAmount: doublePrecision("totalAmount").notNull(),
  paidAmount: doublePrecision("paidAmount").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 255 }).notNull(),
  cardNumber: varchar("cardNumber", { length: 255 }),
  InvoiceId: uuid("InvoiceId")
    .notNull()
    .references(() => invoices.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const quotations = pgTable("quotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  quotationNumber: integer("quotationNumber").default(0).notNull(),
  totalAmount: doublePrecision("totalAmount").notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  labour: doublePrecision("labour").default(0).notNull(),
  approved: boolean("approved").default(false).notNull(),
  notes: varchar("notes", { length: 255 }),
  comments: varchar("comments", { length: 255 }),
  appliedTaxes: json("appliedTaxes"),
  CustomerId: uuid("CustomerId")
    .notNull()
    .references(() => customers.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  CustomerVehicleId: uuid("CustomerVehicleId")
    .notNull()
    .references(() => customer_vehicles.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const quotation_product = pgTable(
  "quotation_product",
  {
    quantity: integer("quantity").default(1).notNull(),
    description: varchar("description", { length: 255 }).default(""),
    price: doublePrecision("price").default(0).notNull(),
    ProductId: uuid("ProductId")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    QuotationId: uuid("QuotationId")
      .notNull()
      .references(() => quotations.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.ProductId, t.QuotationId] })]
);

export const workorders = pgTable("workorders", {
  id: uuid("id").defaultRandom().primaryKey(),
  workOrderNumber: integer("workOrderNumber").default(0).notNull(),
  totalAmount: doublePrecision("totalAmount").notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  labour: doublePrecision("labour").default(0).notNull(),
  status: workOrderStatusEnum("status").default("PENDING").notNull(),
  notes: varchar("notes", { length: 255 }),
  comments: varchar("comments", { length: 255 }),
  appliedTaxes: json("appliedTaxes"),
  CustomerId: uuid("CustomerId")
    .notNull()
    .references(() => customers.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  CustomerVehicleId: uuid("CustomerVehicleId")
    .notNull()
    .references(() => customer_vehicles.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const workorder_product = pgTable(
  "workorder_product",
  {
    quantity: integer("quantity").default(1).notNull(),
    description: varchar("description", { length: 255 }).default(""),
    price: doublePrecision("price").default(0).notNull(),
    ProductId: uuid("ProductId")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    WorkOrderId: uuid("WorkOrderId")
      .notNull()
      .references(() => workorders.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.ProductId, t.WorkOrderId] })]
);

export const product_categories = pgTable("product_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  image: varchar("image", { length: 255 }),
  margin: doublePrecision("margin"),
  price: doublePrecision("price").notNull(),
  description: varchar("description", { length: 255 }),
  cost: doublePrecision("cost"),
  itemCode: varchar("itemCode", { length: 255 }),
  type: varchar("type", { length: 255 }).notNull(),
  taxable: boolean("taxable").notNull(),
  CategoryId: uuid("CategoryId").references(() => product_categories.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const taxes = pgTable("taxes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  rate: doublePrecision("rate").notNull(),
  default: boolean("default").default(false).notNull(),
  BusinessId: uuid("BusinessId").references(() => businesses.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  ...timestamps,
});

export const product_tax = pgTable(
  "product_tax",
  {
    ProductId: uuid("ProductId")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    TaxId: uuid("TaxId")
      .notNull()
      .references(() => taxes.id, { onDelete: "cascade", onUpdate: "cascade" }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.ProductId, t.TaxId] })]
);

export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const package_product = pgTable(
  "package_product",
  {
    quantity: integer("quantity").default(1).notNull(),
    PackageId: uuid("PackageId")
      .notNull()
      .references(() => packages.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    ProductId: uuid("ProductId")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.PackageId, t.ProductId] })]
);

export const inspections = pgTable("inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  data: json("data").notNull(),
  CustomerId: uuid("CustomerId")
    .notNull()
    .references(() => customers.id, {
      onDelete: "cascade",
      onUpdate: "restrict",
    }),
  CustomerVehicleId: uuid("CustomerVehicleId").references(
    () => customer_vehicles.id,
    { onDelete: "cascade", onUpdate: "restrict" }
  ),
  ...timestamps,
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  make: varchar("make", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  ...timestamps,
});

export const archived_invoices = pgTable("archived_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalInvoiceId: uuid("originalInvoiceId").notNull(),
  invoiceNumber: integer("invoiceNumber").default(0).notNull(),
  totalAmount: doublePrecision("totalAmount").notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  paymentStatus: archivedInvoicePaymentStatusEnum("paymentStatus")
    .default("UNPAID")
    .notNull(),
  paidAmount: doublePrecision("paidAmount").default(0).notNull(),
  notes: varchar("notes", { length: 255 }),
  comments: varchar("comments", { length: 255 }),
  manufactureWarranty: boolean("manufactureWarranty").default(false).notNull(),
  roadHazardWarranty: boolean("roadHazardWarranty").default(false).notNull(),
  flatRepairWarranty: boolean("flatRepairWarranty").default(false).notNull(),
  rotationWarranty: boolean("rotationWarranty").default(false).notNull(),
  noWarranty: boolean("noWarranty").default(false).notNull(),
  balanceWarranty: boolean("balanceWarranty").default(false).notNull(),
  // JSON blob stored as text; parse/stringify happens in the routes
  // (parity with the old Sequelize getter/setter on this column).
  payments: text("payments").notNull(),
  CustomerId: uuid("CustomerId")
    .notNull()
    .references(() => customers.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  CustomerVehicleId: uuid("CustomerVehicleId")
    .notNull()
    .references(() => customer_vehicles.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  BusinessId: uuid("BusinessId")
    .notNull()
    .references(() => businesses.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
  ...timestamps,
});

export const archived_invoice_product = pgTable(
  "archived_invoice_product",
  {
    ArchivedInvoiceId: uuid("ArchivedInvoiceId")
      .notNull()
      .references(() => archived_invoices.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    ProductId: uuid("ProductId")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    quantity: integer("quantity").default(1).notNull(),
    description: varchar("description", { length: 255 }).default(""),
    price: doublePrecision("price").default(0).notNull(),
    replacement_reminder_date: timestamp("replacement_reminder_date", {
      withTimezone: true,
      mode: "date",
    }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.ArchivedInvoiceId, t.ProductId] })]
);

// ---------------------------------------------------------------------------
// Relations — keys are named after the Sequelize association aliases so the
// relational-query results keep the same shape the REST responses had
// (`Customer`, `Products` join rows, `Taxes`, ...). Join-table traversals go
// through the *_product/*_permission tables and are flattened in the routes.
// ---------------------------------------------------------------------------

export const businessesRelations = relations(businesses, ({ many }) => ({
  User: many(users),
  Customer: many(customers),
  Appointment: many(appointments),
  Invoice: many(invoices),
  Quotation: many(quotations),
  Tax: many(taxes),
  Product: many(products),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  Business: one(businesses, {
    fields: [users.BusinessId],
    references: [businesses.id],
  }),
  UserPermissions: many(user_permission),
  InvoiceAudits: many(invoice_audits),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  UserPermissions: many(user_permission),
}));

export const userPermissionRelations = relations(user_permission, ({ one }) => ({
  User: one(users, {
    fields: [user_permission.UserId],
    references: [users.id],
  }),
  Permission: one(permissions, {
    fields: [user_permission.PermissionId],
    references: [permissions.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  Business: one(businesses, {
    fields: [customers.BusinessId],
    references: [businesses.id],
  }),
  Address: one(addresses),
  Vehicle: many(customer_vehicles),
  Invoice: many(invoices),
  Quotation: many(quotations),
  WorkOrder: many(workorders),
  Inspection: many(inspections),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  Customer: one(customers, {
    fields: [addresses.CustomerId],
    references: [customers.id],
  }),
}));

export const customerVehiclesRelations = relations(
  customer_vehicles,
  ({ one, many }) => ({
    Customer: one(customers, {
      fields: [customer_vehicles.CustomerId],
      references: [customers.id],
    }),
    Invoice: many(invoices),
    Quotation: many(quotations),
    WorkOrder: many(workorders),
    Inspection: many(inspections),
  })
);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  Business: one(businesses, {
    fields: [appointments.BusinessId],
    references: [businesses.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  Customer: one(customers, {
    fields: [invoices.CustomerId],
    references: [customers.id],
  }),
  CustomerVehicle: one(customer_vehicles, {
    fields: [invoices.CustomerVehicleId],
    references: [customer_vehicles.id],
  }),
  Business: one(businesses, {
    fields: [invoices.BusinessId],
    references: [businesses.id],
  }),
  Payments: many(payments),
  Taxes: many(invoice_tax),
  InvoiceProducts: many(invoice_product),
  Audits: many(invoice_audits),
}));

export const invoiceProductRelations = relations(invoice_product, ({ one }) => ({
  Invoice: one(invoices, {
    fields: [invoice_product.InvoiceId],
    references: [invoices.id],
  }),
  Product: one(products, {
    fields: [invoice_product.ProductId],
    references: [products.id],
  }),
}));

export const invoiceTaxRelations = relations(invoice_tax, ({ one }) => ({
  Invoice: one(invoices, {
    fields: [invoice_tax.InvoiceId],
    references: [invoices.id],
  }),
  Product: one(products, {
    fields: [invoice_tax.ProductId],
    references: [products.id],
  }),
  Tax: one(taxes, {
    fields: [invoice_tax.TaxId],
    references: [taxes.id],
  }),
}));

export const invoiceAuditsRelations = relations(invoice_audits, ({ one }) => ({
  Invoice: one(invoices, {
    fields: [invoice_audits.invoiceId],
    references: [invoices.id],
  }),
  User: one(users, {
    fields: [invoice_audits.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  Invoice: one(invoices, {
    fields: [payments.InvoiceId],
    references: [invoices.id],
  }),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  Customer: one(customers, {
    fields: [quotations.CustomerId],
    references: [customers.id],
  }),
  CustomerVehicle: one(customer_vehicles, {
    fields: [quotations.CustomerVehicleId],
    references: [customer_vehicles.id],
  }),
  Business: one(businesses, {
    fields: [quotations.BusinessId],
    references: [businesses.id],
  }),
  QuotationProducts: many(quotation_product),
}));

export const quotationProductRelations = relations(
  quotation_product,
  ({ one }) => ({
    Quotation: one(quotations, {
      fields: [quotation_product.QuotationId],
      references: [quotations.id],
    }),
    Product: one(products, {
      fields: [quotation_product.ProductId],
      references: [products.id],
    }),
  })
);

export const workordersRelations = relations(workorders, ({ one, many }) => ({
  Customer: one(customers, {
    fields: [workorders.CustomerId],
    references: [customers.id],
  }),
  CustomerVehicle: one(customer_vehicles, {
    fields: [workorders.CustomerVehicleId],
    references: [customer_vehicles.id],
  }),
  Business: one(businesses, {
    fields: [workorders.BusinessId],
    references: [businesses.id],
  }),
  WorkOrderProducts: many(workorder_product),
}));

export const workorderProductRelations = relations(
  workorder_product,
  ({ one }) => ({
    WorkOrder: one(workorders, {
      fields: [workorder_product.WorkOrderId],
      references: [workorders.id],
    }),
    Product: one(products, {
      fields: [workorder_product.ProductId],
      references: [products.id],
    }),
  })
);

export const productCategoriesRelations = relations(
  product_categories,
  ({ one, many }) => ({
    products: many(products),
    Business: one(businesses, {
      fields: [product_categories.BusinessId],
      references: [businesses.id],
    }),
  })
);

export const productsRelations = relations(products, ({ one, many }) => ({
  Business: one(businesses, {
    fields: [products.BusinessId],
    references: [businesses.id],
  }),
  Category: one(product_categories, {
    fields: [products.CategoryId],
    references: [product_categories.id],
  }),
  InvoiceProducts: many(invoice_product),
  QuotationProducts: many(quotation_product),
  WorkOrderProducts: many(workorder_product),
  PackageProducts: many(package_product),
  ProductTaxes: many(product_tax),
  InvoiceTaxes: many(invoice_tax),
  ArchivedInvoiceProducts: many(archived_invoice_product),
}));

export const taxesRelations = relations(taxes, ({ one, many }) => ({
  Business: one(businesses, {
    fields: [taxes.BusinessId],
    references: [businesses.id],
  }),
  ProductTaxes: many(product_tax),
  InvoiceTaxes: many(invoice_tax),
}));

export const productTaxRelations = relations(product_tax, ({ one }) => ({
  Product: one(products, {
    fields: [product_tax.ProductId],
    references: [products.id],
  }),
  Tax: one(taxes, {
    fields: [product_tax.TaxId],
    references: [taxes.id],
  }),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  Business: one(businesses, {
    fields: [packages.BusinessId],
    references: [businesses.id],
  }),
  PackageProducts: many(package_product),
}));

export const packageProductRelations = relations(package_product, ({ one }) => ({
  Package: one(packages, {
    fields: [package_product.PackageId],
    references: [packages.id],
  }),
  Product: one(products, {
    fields: [package_product.ProductId],
    references: [products.id],
  }),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  Customer: one(customers, {
    fields: [inspections.CustomerId],
    references: [customers.id],
  }),
  CustomerVehicle: one(customer_vehicles, {
    fields: [inspections.CustomerVehicleId],
    references: [customer_vehicles.id],
  }),
}));

export const archivedInvoicesRelations = relations(
  archived_invoices,
  ({ one, many }) => ({
    Customer: one(customers, {
      fields: [archived_invoices.CustomerId],
      references: [customers.id],
    }),
    CustomerVehicle: one(customer_vehicles, {
      fields: [archived_invoices.CustomerVehicleId],
      references: [customer_vehicles.id],
    }),
    Business: one(businesses, {
      fields: [archived_invoices.BusinessId],
      references: [businesses.id],
    }),
    ArchivedInvoiceProducts: many(archived_invoice_product),
  })
);

export const archivedInvoiceProductRelations = relations(
  archived_invoice_product,
  ({ one }) => ({
    ArchivedInvoice: one(archived_invoices, {
      fields: [archived_invoice_product.ArchivedInvoiceId],
      references: [archived_invoices.id],
    }),
    Product: one(products, {
      fields: [archived_invoice_product.ProductId],
      references: [products.id],
    }),
  })
);
