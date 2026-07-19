import express from "express";
const router = express.Router();
import { db, invoices, customers, users, products, invoice_product, invoice_tax, invoice_audits, payments, archived_invoices, archived_invoice_product, businesses, } from "../db";
import { pickColumns, nextDocNumber } from "../db/helpers";
import { eq, ne, and, ilike, inArray, isNotNull, desc, asc, gte, lte, lt, sql, type SQL, } from "drizzle-orm";
import { UserRole, InvoicePaymentStatus } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import moment from "moment-timezone";

import { trackObjectChanges, trackProductChanges, } from "../utils/auditHelper";
import authorizePermission from "../middlewares/authorizePermissions";
import "dotenv/config";

const VALID_PAYMENT_STATUSES = Object.values(InvoicePaymentStatus);

// Flatten a drizzle join row ({ ...invoice_product cols, Product }) into the
// legacy Sequelize shape: { ...product, Tax: [...], invoice_product: {...} }.
const toLegacyProduct = (joinRow: any) => {
  const { Product, ...junction } = joinRow;
  const { ProductTaxes, ...product } = Product;
  const legacy = { ...product, invoice_product: junction };
  if (ProductTaxes) {
    legacy.Tax = ProductTaxes.map(({ Tax, ...productTax }: any) => ({
      ...Tax,
      product_tax: productTax,
    }));
  }
  return legacy;
};

const toLegacyInvoice = (inv: any) => {
  if (!inv) return inv;
  const { InvoiceProducts, ...rest } = inv;
  const out = { ...rest };
  if (InvoiceProducts) out.Products = InvoiceProducts.map(toLegacyProduct);
  return out;
};

const taxesListColumns = {
  TaxId: true,
  ProductId: true,
  tax_name: true,
  tax_amount: true,
  tax_rate: true,
  tax_type: true,
} as const;

const fullInvoiceIncludes = {
  Customer: { with: { Address: true, Vehicle: true } },
  CustomerVehicle: true,
  InvoiceProducts: {
    with: {
      Product: {
        with: { ProductTaxes: { with: { Tax: true } }, Category: true },
      },
    },
  },
  Business: true,
  Payments: true,
  Taxes: { columns: taxesListColumns },
} as const;

router.get(
  "/",
  fetchUser,
  authorizePermission("invoice:read"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, filters } = req.query;

      const parsedFilters = JSON.parse(filters as string);
      const {
        CustomerDetails,
        paymentStatus,
        startDate,
        endDate,
        isReport,
        order,
      } = parsedFilters;
      const conditions: SQL[] = [];

      if (Array.isArray(paymentStatus) && paymentStatus.length > 0) {
        const validStatuses = paymentStatus.filter((s) =>
          VALID_PAYMENT_STATUSES.includes(s)
        );
        conditions.push(
          validStatuses.length
            ? inArray(invoices.paymentStatus, validStatuses)
            : sql`false`
        );
      }

      let matchedCustomerIds = null;
      if (
        (CustomerDetails?.name &&
          typeof CustomerDetails?.name === "string" &&
          CustomerDetails?.name?.trim() !== "") ||
        CustomerDetails?.id
      ) {
        const matched = await db
          .select({ id: customers.id })
          .from(customers)
          .where(
            ilike(
              sql`(${customers.firstName} || ' ' || ${customers.lastName})`,
              `%${CustomerDetails?.name?.trim()}%`
            )
          );
        matchedCustomerIds = matched.map((customer) => customer.id);
      }

      if (matchedCustomerIds && matchedCustomerIds.length > 0) {
        conditions.push(inArray(invoices.CustomerId, matchedCustomerIds));
      } else if (CustomerDetails?.id) {
        conditions.push(inArray(invoices.CustomerId, [CustomerDetails.id]));
      } else if (CustomerDetails?.name?.trim()) {
        conditions.push(sql`false`);
      }

      if (startDate && endDate) {
        const parsedStartDate = moment.utc(startDate).toDate();
        const parsedEndDate = moment.utc(endDate).toDate();

        if (!isNaN(parsedStartDate.getTime()) && !isNaN(parsedEndDate.getTime())) {
          conditions.push(gte(invoices.createdAt, parsedStartDate));
          conditions.push(lte(invoices.createdAt, parsedEndDate));
        }
      }

      const userId = req.user.id;
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          ne(users.role, UserRole.SUPER_ADMIN),
          isNotNull(users.BusinessId)
        ),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found", data: [] });
      }

      conditions.push(eq(invoices.BusinessId, user.BusinessId!));
      const whereCondition = and(...conditions);

      const sortOrder =
        order && String(order).toUpperCase() === "ASC"
          ? [asc(invoices.createdAt)]
          : [desc(invoices.createdAt)];
      const parsedIsReport = isReport ? true : false;

      if (parsedIsReport) {
        const reportInvoices = await db.query.invoices.findMany({
          where: whereCondition,
          orderBy: sortOrder,
          with: {
            Customer: { with: { Address: true, Vehicle: true } },
            InvoiceProducts: {
              with: {
                Product: {
                  with: {
                    ProductTaxes: { with: { Tax: true } },
                    Category: true,
                  },
                },
              },
            },
            Payments: true,
            Taxes: { columns: taxesListColumns },
          },
        });

        return res.json({
          message: "Invoices fetched successfully (report)",
          data: reportInvoices.map(toLegacyInvoice),
        });
      }

      const offset = (Number(page) - 1) * Number(limit);

      const count = await db.$count(invoices, whereCondition);
      const rows = await db.query.invoices.findMany({
        where: whereCondition,
        orderBy: sortOrder,
        limit: Number(limit),
        offset: Number(offset),
        with: fullInvoiceIncludes,
      });

      const formattedInvoices = rows.map((inv) => {
        const appliedTaxes: Record<string, any> = {};

        inv.Taxes?.forEach((t) => {
          const key = `${t.ProductId}_${t.TaxId}`;

          if (!appliedTaxes[key]) {
            appliedTaxes[key] = t;
          }

          // appliedTaxes[key].total_amount += parseFloat(t.tax_amount || 0);
        });

        return {
          ...toLegacyInvoice(inv),
          appliedTaxes: appliedTaxes,
        };
      });

      return res.json({
        message: "Invoices fetched successfully",
        data: formattedInvoices,
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/:id",
  fetchUser,
  authorizePermission("invoice:read"),
  async (req, res) => {
    try {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, req.params.id),
        with: {
          ...fullInvoiceIncludes,
          Taxes: { columns: { tax_name: true, tax_amount: true } },
        },
      });

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.json({
        message: "Invoices fetched successfully",
        data: toLegacyInvoice(invoice),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/create",
  fetchUser,
  authorizePermission("invoice:create"),
  async (req, res) => {
    try {
      const invoiceData = req.body.invoiceData;

      if (!("CustomerId" in invoiceData)) {
        return res.status(409).json({ message: "Customer Id is mandatory" });
      }

      const newInvoice = await db.transaction(async (tx) => {
        const invoiceNumber = await nextDocNumber(
          tx,
          invoices,
          invoices.invoiceNumber,
          invoiceData.BusinessId
        );
        const [created] = await tx
          .insert(invoices)
          .values({ ...pickColumns(invoices, invoiceData), invoiceNumber })
          .returning();

        // Handle products
        if (req.body.products && req.body.products.length !== 0) {
          await Promise.all(
            req.body.products.map(async (product: any) => {
              const productRecord = await tx.query.products.findFirst({
                where: eq(products.id, product.id),
              });
              if (productRecord) {
                await tx.insert(invoice_product).values({
                  InvoiceId: created.id,
                  ProductId: productRecord.id,
                  quantity: product.quantity,
                  description: product.description,
                  price: product.price,
                  replacement_reminder_date: product.replacement_reminder_date
                    ? new Date(product.replacement_reminder_date)
                    : null,
                });
              }
            })
          );
        }

        // Handle taxes
        if (req.body.taxes && req.body.taxes.length > 0) {
          await Promise.all(
            req.body.taxes.map(async (invoiceTax: any) => {
              await tx.insert(invoice_tax).values({
                ...pickColumns(invoice_tax, invoiceTax),
                InvoiceId: created.id,
              });
            })
          );
        }

        return created;
      });

      const currentInvoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, newInvoice.id),
        with: fullInvoiceIncludes,
      });

      const formattedCurrentInvoice = {
        ...toLegacyInvoice(currentInvoice),
        appliedTaxes: currentInvoice!.Taxes,
      };

      return res.status(200).json({
        message: "Invoice created successfully",
        data: formattedCurrentInvoice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/update/:id",
  fetchUser,
  authorizePermission("invoice:update"),
  async (req, res) => {
    try {
      let payload = req.body;
      const invoiceRow = await db.query.invoices.findFirst({
        where: eq(invoices.id, req.params.id),
        with: { InvoiceProducts: { with: { Product: true } } },
      });

      if (!invoiceRow) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const invoice = toLegacyInvoice(invoiceRow);

      if (
        !(
          Object.keys(payload.invoiceData).length === 1 &&
          payload.invoiceData.hasOwnProperty("paymentStatus")
        )
      ) {
        // Track changes in invoice data
        if (req.body.invoiceData && req.body.products) {
          await trackObjectChanges(
            invoice.id,
            req.user.id,
            invoice,
            req.body.invoiceData,
            req.body.products
          );
        }
      }

      // Update invoice data
      if (req.body.invoiceData) {
        const updates = pickColumns(invoices, req.body.invoiceData);
        if (Object.keys(updates).length) {
          await db
            .update(invoices)
            .set(updates)
            .where(eq(invoices.id, invoice.id));
        }
      }

      // Update products
      if (req.body?.products && req.body?.products.length > 0) {
        try {
          // Remove all existing products
          await db
            .delete(invoice_product)
            .where(eq(invoice_product.InvoiceId, invoice.id));

          // Add updated products
          await Promise.all(
            req.body.products.map(async (product: any) => {
              const productRecord = await db.query.products.findFirst({
                where: eq(products.id, product.id),
              });
              if (productRecord) {
                await db.insert(invoice_product).values({
                  InvoiceId: invoice.id,
                  ProductId: productRecord.id,
                  quantity: product.quantity,
                  description: product.description,
                  price: product.price,
                  replacement_reminder_date: product.replacement_reminder_date
                    ? new Date(product.replacement_reminder_date)
                    : null,
                });
              }
            })
          );
        } catch (error) {
          console.error("Error updating products:", error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      }

      // for invoice taxes
      if (req.body?.taxes && req.body?.taxes.length > 0) {
        try {
          // Remove all existing invoice taxes
          await db
            .delete(invoice_tax)
            .where(eq(invoice_tax.InvoiceId, invoice.id));

          // Add updated invoice taxes
          await Promise.all(
            req.body.taxes.map(async (invoiceTax: any) => {
              await db.insert(invoice_tax).values({
                ...pickColumns(invoice_tax, invoiceTax),
                InvoiceId: invoice.id,
              });
            })
          );
        } catch (error) {
          console.error("Error updating products:", error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      }

      const currentInvoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, invoice.id),
        with: fullInvoiceIncludes,
      });

      const formattedCurrentInvoice = {
        ...toLegacyInvoice(currentInvoice),
        appliedTaxes: currentInvoice!.Taxes,
      };

      return res.status(200).json({
        message: "Invoice updated successfully",
        data: formattedCurrentInvoice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/update-shadow/:id",
  fetchUser,
  authorizePermission("invoice:update"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          ne(users.role, UserRole.SUPER_ADMIN),
          isNotNull(users.BusinessId)
        ),
      });

      if (user!.role !== "ADMIN")
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permission" });

      let payload = req.body;
      const invoiceRow = await db.query.invoices.findFirst({
        where: eq(invoices.id, req.params.id),
        with: {
          InvoiceProducts: {
            with: {
              Product: {
                with: {
                  ProductTaxes: { with: { Tax: true } },
                  Category: true,
                },
              },
            },
          },
          Business: true,
          Payments: true,
          Taxes: true,
        },
      });

      if (!invoiceRow) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const invoice = toLegacyInvoice(invoiceRow);

      // Check if archived invoice already exists
      const isArchivedInvoiceExists =
        await db.query.archived_invoices.findFirst({
          where: eq(archived_invoices.originalInvoiceId, invoice.id),
        });

      if (isArchivedInvoiceExists) {
        return res.status(409).json({
          message: "Archived invoice already exists for this invoice",
        });
      }

      // create archived invoice
      const { id, Business, Payments, Products, ...restData } = invoice;

      const paymentsSnapshot = Payments.map((payment: any) => {
        const { id, ...restObj } = payment;
        return { ...restObj };
      });
      // Create archived invoice data
      const archivedData = pickColumns(archived_invoices, restData);
      // the archive enum predates VOIDED; keep its legacy VOID spelling
      if ((archivedData.paymentStatus as string) === "VOIDED")
        archivedData.paymentStatus = "VOID";
      const [newArchivedInvoice] = await db
        .insert(archived_invoices)
        .values({
          ...archivedData,
          originalInvoiceId: id,
          payments: JSON.stringify(paymentsSnapshot),
          createdAt: restData.createdAt,
          updatedAt: restData.updatedAt,
        })
        .returning();
      if (Products && Products.length !== 0) {
        await Promise.all(
          Products.map(async (product: any) => {
            if (product) {
              await db.insert(archived_invoice_product).values({
                ArchivedInvoiceId: newArchivedInvoice.id,
                ProductId: product.id,
                quantity: product.invoice_product.quantity,
                description: product.invoice_product.description,
                price: product.invoice_product.price,
                replacement_reminder_date: product.invoice_product
                  .replacement_reminder_date
                  ? product.invoice_product.replacement_reminder_date
                  : null,
              });
            }
          })
        );
      }

      // get first cash payment
      const getFirstCashPayment = invoice.Payments.find(
        (payment: any) => payment.paymentMethod === "Cash"
      );

      // get Total amount of other payments
      const getOtherPaymentsAmount = invoice.Payments.reduce((acc: number, payment: any) => {
        if (payment.paymentMethod !== "Cash") {
          return acc + parseFloat(payment.paidAmount);
        }
        return acc;
      }, 0);

      // get payment difference
      const paymentDifference = (
        parseFloat(payload.invoiceData.totalAmount) - getOtherPaymentsAmount
      ).toFixed(2);

      // Update invoice data
      payload.invoiceData.paidAmount = payload.invoiceData.totalAmount;
      payload.invoiceData.isArchived = true;
      if (payload.invoiceData) {
        const updates = pickColumns(invoices, payload.invoiceData);
        if (Object.keys(updates).length) {
          await db
            .update(invoices)
            .set(updates)
            .where(eq(invoices.id, invoice.id));
        }
      }

      // Update products
      if (payload?.products && payload?.products.length > 0) {
        try {
          // Remove all existing products
          await db
            .delete(invoice_product)
            .where(eq(invoice_product.InvoiceId, invoice.id));

          // Add updated products
          await Promise.all(
            payload.products.map(async (product: any) => {
              const productRecord = await db.query.products.findFirst({
                where: eq(products.id, product.id),
              });
              if (productRecord) {
                await db.insert(invoice_product).values({
                  InvoiceId: invoice.id,
                  ProductId: productRecord.id,
                  quantity: product.quantity,
                  description: product.description,
                  price: product.price,
                  replacement_reminder_date: product.replacement_reminder_date
                    ? new Date(product.replacement_reminder_date)
                    : null,
                });
              }
            })
          );
        } catch (error) {
          console.error("Error updating products:", error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      }

      // Update Payments
      if (parseInt(paymentDifference) !== 0) {
        // Delete all cash payments
        const cashPaymentIds = invoice.Payments.filter(
          (payment: any) => payment.paymentMethod === "Cash"
        ).map((payment: any) => payment.id);
        if (cashPaymentIds.length) {
          await db.delete(payments).where(inArray(payments.id, cashPaymentIds));
        }

        const paymentData = {
          InvoiceId: invoice.id,
          paidAmount: Number(paymentDifference),
          totalAmount: Number(paymentDifference),
          paymentMethod: "Cash",
          createdAt: getFirstCashPayment!.createdAt,
          updatedAt: getFirstCashPayment!.updatedAt,
        };

        // create a new cash payment
        await db.insert(payments).values(paymentData);
      }

      const currentInvoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, invoice.id),
        with: {
          Customer: { with: { Address: true, Vehicle: true } },
          CustomerVehicle: true,
          InvoiceProducts: {
            with: {
              Product: { with: { ProductTaxes: { with: { Tax: true } } } },
            },
          },
          Business: true,
          Payments: true,
        },
      });

      return res.status(200).json({
        message: "Invoice updated successfully",
        data: toLegacyInvoice(currentInvoice),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  "/delete/:id/:status",
  fetchUser,
  authorizePermission("invoice:delete"),
  async (req, res) => {
    try {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, req.params.id),
        with: { Payments: true },
      });

      if (!invoice) {
        return res.status(404).json({ message: "invoice not found" });
      }

      if (invoice.Payments.length > 0) {
        try {
          await db
            .delete(payments)
            .where(eq(payments.InvoiceId, invoice.id));
        } catch (error) {
          console.error(error);
          return res
            .status(500)
            .json({ message: "Error deleting invoice payments" });
        }
      } else {
        if (invoice.paymentStatus === "REFUNDED") {
          return res.status(409).json({ message: "Invoice already refunded" });
        }
        if (invoice.paymentStatus === "VOIDED") {
          return res.status(409).json({ message: "Invoice already voided" });
        }
      }

      await db
        .update(invoices)
        .set({ paymentStatus: req.params.status as InvoicePaymentStatus })
        .where(eq(invoices.id, invoice.id));
      return res.status(200).json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting invoice" });
    }
  }
);

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, req.params.id),
    });

    if (!invoice) {
      return res.status(404).json({ message: "invoice not found" });
    }

    await db.delete(invoices).where(eq(invoices.id, invoice.id));

    return res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

// Get invoice audit history
router.get("/audit/:id", fetchUser, async (req, res) => {
  try {
    // Validate invoice ID
    if (!req.params.id) {
      return res.status(400).json({
        message: "Invoice ID is required",
        data: [],
      });
    }

    // Check if invoice exists
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, req.params.id),
    });
    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
        status: 404,
        data: [],
      });
    }

    const auditHistory = await db.query.invoice_audits.findMany({
      where: eq(invoice_audits.invoiceId, req.params.id),
      orderBy: [desc(invoice_audits.createdAt)],
      with: {
        User: {
          columns: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Audit history retrieved successfully",
      status: 200,
      data: auditHistory || [],
    });
  } catch (error) {
    console.error("Error fetching audit history:", error);
    return res.status(200).json({
      message: "Unable to load audit history. Please try again later.",
      status: 500,
      data: [],
    });
  }
});

router.get("/today-reminders/:businessId", fetchUser, async (req, res) => {
  try {
    const business = await db.query.businesses.findFirst({
      columns: { id: true, timezone: true },
      where: eq(businesses.id, req.params.businessId),
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
        status: 404,
        data: [],
      });
    }

    const tz = business.timezone || "UTC";
    const todayInBusinessTz = moment().tz(tz).format("YYYY-MM-DD");
    const dayStart = moment.tz(todayInBusinessTz, tz).toDate();
    const dayEnd = moment.tz(todayInBusinessTz, tz).add(1, "day").toDate();

    const reminderRows = await db.query.invoice_product.findMany({
      where: and(
        gte(invoice_product.replacement_reminder_date, dayStart),
        lt(invoice_product.replacement_reminder_date, dayEnd)
      ),
      with: {
        Invoice: {
          with: {
            Customer: {
              with: {
                Business: true,
              },
            },
          },
        },
        Product: true,
      },
    });

    const reminders = reminderRows.filter(
      (row) => row.Invoice && row.Invoice.BusinessId === business.id
    );

    return res.status(200).json({
      message: "Reminders fetched successfully",
      status: 200,
      data: reminders || [],
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return res.status(500).json({
      message: "Unable to get reminders. Please try again later.",
      status: 500,
      data: [],
    });
  }
});

export default router;
