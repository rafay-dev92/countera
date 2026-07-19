import express from "express";
const router = express.Router();
import { db, payments, invoices } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, asc } from "drizzle-orm";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

router.get("/:invoiceId", fetchUser, async (req, res) => {
  try {
    const paymentRows = await db.query.payments.findMany({
      where: eq(payments.InvoiceId, req.params.invoiceId),
      orderBy: [asc(payments.createdAt)],
    });
    res.json(paymentRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const paymentData = req.body;
    const [newPayment] = await db
      .insert(payments)
      .values(pickColumns(payments, paymentData))
      .returning();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, newPayment.InvoiceId),
    });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.paidAmount === invoice.totalAmount) {
      return res.status(400).json({ message: "Invoice is already fully paid" });
    }

    if (newPayment.paidAmount + invoice.paidAmount > invoice.totalAmount) {
      return res
        .status(400)
        .json({ message: "Payment exceeds total invoice amount" });
    }

    let updatedInvoice: typeof invoices.$inferSelect | null = null;
    if (newPayment.paidAmount + invoice.paidAmount < invoice.totalAmount) {
      [updatedInvoice] = await db
        .update(invoices)
        .set({
          paidAmount: invoice.paidAmount + newPayment.paidAmount,
          paymentStatus: "PARTIALLY_PAID",
        })
        .where(eq(invoices.id, invoice.id))
        .returning();
    } else if (
      newPayment.paidAmount + invoice.paidAmount ===
      invoice.totalAmount
    ) {
      [updatedInvoice] = await db
        .update(invoices)
        .set({
          paidAmount: invoice.totalAmount,
          paymentStatus: "PAID",
        })
        .where(eq(invoices.id, invoice.id))
        .returning();
    }

    res.json(newPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, req.params.id),
    });

    if (!payment) {
      return res.status(404).json({ message: "payment not found" });
    }

    const updates = pickColumns(payments, req.body);
    if (Object.keys(updates).length) {
      await db
        .update(payments)
        .set(updates)
        .where(eq(payments.id, req.params.id));
    }

    res.json({ message: "Payment updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, req.params.id),
    });

    if (!payment) {
      return res.status(404).json({ message: "address not found" });
    }

    await db.delete(payments).where(eq(payments.id, req.params.id));

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

export default router;
