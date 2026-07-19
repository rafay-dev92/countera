CREATE TYPE "public"."archived_invoice_payment_status" AS ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."invoice_audit_change_type" AS ENUM('UPDATE', 'ADD', 'REMOVE', 'UPDATE_ADD', 'UPDATE_REMOVE', 'ADD_REMOVE', 'MULTIPLE');--> statement-breakpoint
CREATE TYPE "public"."invoice_payment_status" AS ENUM('PAID', 'PARTIALLY_PAID', 'UNPAID', 'VOIDED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."invoice_tax_type" AS ENUM('%', '$');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'MANAGER', 'CASHIER', 'SALESMAN');--> statement-breakpoint
CREATE TYPE "public"."workorder_status" AS ENUM('PENDING', 'FINISHED');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"street" varchar(255),
	"city" varchar(255),
	"state" varchar(255),
	"zipcode" integer,
	"CustomerId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customerName" varchar(255) NOT NULL,
	"customerEmail" varchar(255),
	"description" varchar(255),
	"startDateTime" timestamp with time zone NOT NULL,
	"endDateTime" timestamp with time zone NOT NULL,
	"sendEmail" boolean NOT NULL,
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archived_invoice_product" (
	"ArchivedInvoiceId" uuid NOT NULL,
	"ProductId" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"description" varchar(255) DEFAULT '',
	"price" double precision DEFAULT 0 NOT NULL,
	"replacement_reminder_date" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "archived_invoice_product_ArchivedInvoiceId_ProductId_pk" PRIMARY KEY("ArchivedInvoiceId","ProductId")
);
--> statement-breakpoint
CREATE TABLE "archived_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"originalInvoiceId" uuid NOT NULL,
	"invoiceNumber" integer DEFAULT 0 NOT NULL,
	"totalAmount" double precision NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"paymentStatus" "archived_invoice_payment_status" DEFAULT 'UNPAID' NOT NULL,
	"paidAmount" double precision DEFAULT 0 NOT NULL,
	"notes" varchar(255),
	"comments" varchar(255),
	"manufactureWarranty" boolean DEFAULT false NOT NULL,
	"roadHazardWarranty" boolean DEFAULT false NOT NULL,
	"flatRepairWarranty" boolean DEFAULT false NOT NULL,
	"rotationWarranty" boolean DEFAULT false NOT NULL,
	"noWarranty" boolean DEFAULT false NOT NULL,
	"balanceWarranty" boolean DEFAULT false NOT NULL,
	"payments" text NOT NULL,
	"CustomerId" uuid NOT NULL,
	"CustomerVehicleId" uuid NOT NULL,
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"logo" varchar(255),
	"address" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"zipcode" integer NOT NULL,
	"timezone" varchar(255) DEFAULT 'America/Los_Angeles',
	"licenseNumber" varchar(255),
	"permitNumber" varchar(255),
	"tel" varchar(255) NOT NULL,
	"fax" varchar(255),
	"defaultMargin" double precision,
	"termsAndConditions" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" varchar(255) NOT NULL,
	"model" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"odometer" integer NOT NULL,
	"engineSize" varchar(255),
	"licenseNo" varchar(255),
	"vinNo" varchar(255),
	"color" varchar(255),
	"notes" text,
	"CustomerId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"customerType" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(255),
	"licenseNo" varchar(255),
	"notes" text,
	"taxable" boolean NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" json NOT NULL,
	"CustomerId" uuid NOT NULL,
	"CustomerVehicleId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoiceId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"fieldName" varchar(255) NOT NULL,
	"oldValue" text,
	"newValue" text,
	"changeType" "invoice_audit_change_type" NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now(),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_product" (
	"quantity" integer DEFAULT 1 NOT NULL,
	"description" varchar(255) DEFAULT '',
	"price" double precision DEFAULT 0 NOT NULL,
	"replacement_reminder_date" timestamp with time zone,
	"ProductId" uuid NOT NULL,
	"InvoiceId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_product_ProductId_InvoiceId_pk" PRIMARY KEY("ProductId","InvoiceId")
);
--> statement-breakpoint
CREATE TABLE "invoice_tax" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"InvoiceId" uuid NOT NULL,
	"ProductId" uuid NOT NULL,
	"TaxId" uuid NOT NULL,
	"tax_name" varchar(255) DEFAULT '',
	"tax_rate" double precision DEFAULT 0 NOT NULL,
	"tax_type" "invoice_tax_type" DEFAULT '%' NOT NULL,
	"tax_amount" double precision DEFAULT 0 NOT NULL,
	"description" varchar(255) DEFAULT '',
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoiceNumber" integer DEFAULT 0 NOT NULL,
	"totalAmount" double precision NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"labour" double precision DEFAULT 0 NOT NULL,
	"paymentStatus" "invoice_payment_status" DEFAULT 'UNPAID' NOT NULL,
	"paidAmount" double precision DEFAULT 0 NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"notes" varchar(255),
	"comments" varchar(255),
	"manufactureWarranty" boolean DEFAULT false NOT NULL,
	"roadHazardWarranty" boolean DEFAULT false NOT NULL,
	"flatRepairWarranty" boolean DEFAULT false NOT NULL,
	"rotationWarranty" boolean DEFAULT false NOT NULL,
	"noWarranty" boolean DEFAULT false NOT NULL,
	"balanceWarranty" boolean DEFAULT false NOT NULL,
	"CustomerId" uuid NOT NULL,
	"CustomerVehicleId" uuid NOT NULL,
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_product" (
	"quantity" integer DEFAULT 1 NOT NULL,
	"PackageId" uuid NOT NULL,
	"ProductId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_product_PackageId_ProductId_pk" PRIMARY KEY("PackageId","ProductId")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"totalAmount" double precision NOT NULL,
	"paidAmount" double precision NOT NULL,
	"paymentMethod" varchar(255) NOT NULL,
	"cardNumber" varchar(255),
	"InvoiceId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_tax" (
	"ProductId" uuid NOT NULL,
	"TaxId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_tax_ProductId_TaxId_pk" PRIMARY KEY("ProductId","TaxId")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255),
	"margin" double precision,
	"price" double precision NOT NULL,
	"description" varchar(255),
	"cost" double precision,
	"itemCode" varchar(255),
	"type" varchar(255) NOT NULL,
	"taxable" boolean NOT NULL,
	"CategoryId" uuid,
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_product" (
	"quantity" integer DEFAULT 1 NOT NULL,
	"description" varchar(255) DEFAULT '',
	"price" double precision DEFAULT 0 NOT NULL,
	"ProductId" uuid NOT NULL,
	"QuotationId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotation_product_ProductId_QuotationId_pk" PRIMARY KEY("ProductId","QuotationId")
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotationNumber" integer DEFAULT 0 NOT NULL,
	"totalAmount" double precision NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"labour" double precision DEFAULT 0 NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"notes" varchar(255),
	"comments" varchar(255),
	"appliedTaxes" json,
	"CustomerId" uuid NOT NULL,
	"CustomerVehicleId" uuid NOT NULL,
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"rate" double precision NOT NULL,
	"default" boolean DEFAULT false NOT NULL,
	"BusinessId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_permission" (
	"UserId" uuid NOT NULL,
	"PermissionId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_permission_UserId_PermissionId_pk" PRIMARY KEY("UserId","PermissionId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"phone" varchar(255),
	"dob" date,
	"BusinessId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" varchar(255) NOT NULL,
	"model" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workorder_product" (
	"quantity" integer DEFAULT 1 NOT NULL,
	"description" varchar(255) DEFAULT '',
	"price" double precision DEFAULT 0 NOT NULL,
	"ProductId" uuid NOT NULL,
	"WorkOrderId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workorder_product_ProductId_WorkOrderId_pk" PRIMARY KEY("ProductId","WorkOrderId")
);
--> statement-breakpoint
CREATE TABLE "workorders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workOrderNumber" integer DEFAULT 0 NOT NULL,
	"totalAmount" double precision NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"labour" double precision DEFAULT 0 NOT NULL,
	"status" "workorder_status" DEFAULT 'PENDING' NOT NULL,
	"notes" varchar(255),
	"comments" varchar(255),
	"appliedTaxes" json,
	"CustomerId" uuid NOT NULL,
	"CustomerVehicleId" uuid NOT NULL,
	"BusinessId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_CustomerId_customers_id_fk" FOREIGN KEY ("CustomerId") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "archived_invoice_product" ADD CONSTRAINT "archived_invoice_product_ArchivedInvoiceId_archived_invoices_id_fk" FOREIGN KEY ("ArchivedInvoiceId") REFERENCES "public"."archived_invoices"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "archived_invoice_product" ADD CONSTRAINT "archived_invoice_product_ProductId_products_id_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "archived_invoices" ADD CONSTRAINT "archived_invoices_CustomerId_customers_id_fk" FOREIGN KEY ("CustomerId") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "archived_invoices" ADD CONSTRAINT "archived_invoices_CustomerVehicleId_customer_vehicles_id_fk" FOREIGN KEY ("CustomerVehicleId") REFERENCES "public"."customer_vehicles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "archived_invoices" ADD CONSTRAINT "archived_invoices_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_CustomerId_customers_id_fk" FOREIGN KEY ("CustomerId") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_CustomerId_customers_id_fk" FOREIGN KEY ("CustomerId") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_CustomerVehicleId_customer_vehicles_id_fk" FOREIGN KEY ("CustomerVehicleId") REFERENCES "public"."customer_vehicles"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "invoice_audits" ADD CONSTRAINT "invoice_audits_invoiceId_invoices_id_fk" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoice_audits" ADD CONSTRAINT "invoice_audits_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoice_product" ADD CONSTRAINT "invoice_product_ProductId_products_id_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "invoice_product" ADD CONSTRAINT "invoice_product_InvoiceId_invoices_id_fk" FOREIGN KEY ("InvoiceId") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "invoice_tax" ADD CONSTRAINT "invoice_tax_InvoiceId_invoices_id_fk" FOREIGN KEY ("InvoiceId") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tax" ADD CONSTRAINT "invoice_tax_ProductId_products_id_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_tax" ADD CONSTRAINT "invoice_tax_TaxId_taxes_id_fk" FOREIGN KEY ("TaxId") REFERENCES "public"."taxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_CustomerId_customers_id_fk" FOREIGN KEY ("CustomerId") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_CustomerVehicleId_customer_vehicles_id_fk" FOREIGN KEY ("CustomerVehicleId") REFERENCES "public"."customer_vehicles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "package_product" ADD CONSTRAINT "package_product_PackageId_packages_id_fk" FOREIGN KEY ("PackageId") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "package_product" ADD CONSTRAINT "package_product_ProductId_products_id_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_InvoiceId_invoices_id_fk" FOREIGN KEY ("InvoiceId") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_tax" ADD CONSTRAINT "product_tax_ProductId_products_id_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_tax" ADD CONSTRAINT "product_tax_TaxId_taxes_id_fk" FOREIGN KEY ("TaxId") REFERENCES "public"."taxes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_CategoryId_product_categories_id_fk" FOREIGN KEY ("CategoryId") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quotation_product" ADD CONSTRAINT "quotation_product_ProductId_products_id_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "quotation_product" ADD CONSTRAINT "quotation_product_QuotationId_quotations_id_fk" FOREIGN KEY ("QuotationId") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_CustomerId_customers_id_fk" FOREIGN KEY ("CustomerId") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_CustomerVehicleId_customer_vehicles_id_fk" FOREIGN KEY ("CustomerVehicleId") REFERENCES "public"."customer_vehicles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_permission" ADD CONSTRAINT "user_permission_UserId_users_id_fk" FOREIGN KEY ("UserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_permission" ADD CONSTRAINT "user_permission_PermissionId_permissions_id_fk" FOREIGN KEY ("PermissionId") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workorder_product" ADD CONSTRAINT "workorder_product_ProductId_products_id_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "workorder_product" ADD CONSTRAINT "workorder_product_WorkOrderId_workorders_id_fk" FOREIGN KEY ("WorkOrderId") REFERENCES "public"."workorders"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "workorders" ADD CONSTRAINT "workorders_CustomerId_customers_id_fk" FOREIGN KEY ("CustomerId") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workorders" ADD CONSTRAINT "workorders_CustomerVehicleId_customer_vehicles_id_fk" FOREIGN KEY ("CustomerVehicleId") REFERENCES "public"."customer_vehicles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workorders" ADD CONSTRAINT "workorders_BusinessId_businesses_id_fk" FOREIGN KEY ("BusinessId") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE cascade;