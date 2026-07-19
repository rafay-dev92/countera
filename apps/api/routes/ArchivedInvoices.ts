import express from "express";
const router = express.Router();
import { db, users, archived_invoices } from "../db";
import { eq, ne, and, isNotNull, desc } from "drizzle-orm";
import { UserRole } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";

// Flatten join rows to the legacy Sequelize shape and parse the payments
// TEXT column (the old model had a JSON getter on it).
const toLegacyArchivedInvoice = (inv: any) => {
  if (!inv) return inv;
  const { ArchivedInvoiceProducts, ...rest } = inv;
  const out = {
    ...rest,
    payments: rest.payments ? JSON.parse(rest.payments) : [],
  };
  if (ArchivedInvoiceProducts) {
    out.Products = ArchivedInvoiceProducts.map((joinRow: any) => {
      const { Product, ...junction } = joinRow;
      const { ProductTaxes, ...product } = Product;
      const legacy = { ...product, archived_invoice_product: junction };
      if (ProductTaxes) {
        legacy.Tax = ProductTaxes.map(({ Tax, ...productTax }: any) => ({
          ...Tax,
          product_tax: productTax,
        }));
      }
      return legacy;
    });
  }
  return out;
};

router.get("/", fetchUser, async (req, res) => {
  try {
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

    const archivedRows = await db.query.archived_invoices.findMany({
      orderBy: [desc(archived_invoices.createdAt)],
      with: {
        Customer: { with: { Address: true, Vehicle: true } },
        CustomerVehicle: true,
        ArchivedInvoiceProducts: {
          with: {
            Product: {
              with: { ProductTaxes: { with: { Tax: true } }, Category: true },
            },
          },
        },
        Business: true,
      },
    });

    return res.json({
      message: "Invoices fetched successfully",
      data: archivedRows.map(toLegacyArchivedInvoice),
    });

    //   return res.json({
    //     message: "Invoices fetched successfully",
    //     data: rows,
    //     total: count,
    //     page: Number(page),
    //     limit: Number(limit),
    //     totalPages: Math.ceil(count / limit),
    //   });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const invoice = await db.query.archived_invoices.findFirst({
      where: eq(archived_invoices.id, req.params.id),
      with: {
        Customer: { with: { Address: true, Vehicle: true } },
        CustomerVehicle: true,
        ArchivedInvoiceProducts: {
          with: {
            Product: { with: { ProductTaxes: { with: { Tax: true } } } },
          },
        },
        Business: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json({
      message: "Invoice fetched successfully",
      data: toLegacyArchivedInvoice(invoice),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const invoice = await db.query.archived_invoices.findFirst({
      where: eq(archived_invoices.id, req.params.id),
    });

    if (!invoice) {
      return res.status(404).json({ message: "invoice not found" });
    }

    await db
      .delete(archived_invoices)
      .where(eq(archived_invoices.id, invoice.id));

    return res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

export default router;
