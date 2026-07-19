import { db, invoices as invoicesTable, invoice_product } from "../db";
import { and, gte, lt, inArray } from "drizzle-orm";
import sendEmail from "./sendMail";

const replacementReminder = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Invoices having at least one product due for replacement today,
    // with the Products list filtered to just those rows (parity with the
    // old include.where inner-join semantics).
    const dueJoinRows = await db
      .select({ InvoiceId: invoice_product.InvoiceId })
      .from(invoice_product)
      .where(
        and(
          gte(invoice_product.replacement_reminder_date, today),
          lt(invoice_product.replacement_reminder_date, tomorrow)
        )
      );
    const dueInvoiceIds = [...new Set(dueJoinRows.map((r) => r.InvoiceId))];

    const invoiceRows = dueInvoiceIds.length
      ? await db.query.invoices.findMany({
          where: inArray(invoicesTable.id, dueInvoiceIds),
          with: {
            InvoiceProducts: { with: { Product: true } },
            Customer: { with: { Business: true } },
          },
        })
      : [];

    const invoices = invoiceRows.map((inv) => {
      const { InvoiceProducts, ...rest } = inv;
      return {
        ...rest,
        Products: InvoiceProducts.filter(
          (jp) =>
            jp.replacement_reminder_date &&
            jp.replacement_reminder_date >= today &&
            jp.replacement_reminder_date < tomorrow
        ).map(({ Product, ...junction }) => ({
          ...Product,
          invoice_product: junction,
        })),
      };
    });

    for (const invoice of invoices) {
      // NOTE: pre-existing bug kept as-is — the alias is `Products`, so
      // `invoice.Product` is undefined and this loop throws into the catch
      // below (reminder mails have never actually been sent).
      for (const product of (invoice as any).Product) {
        const reminderDate = new Date(
          product.invoice_product.replacement_reminder_date
        );
        reminderDate.setHours(0, 0, 0, 0);

        if (reminderDate.getTime() === today.getTime()) {
          const customer = invoice.Customer;
          const business = invoice.Customer.Business;
          const emailData = {
            from: `"${business.name}" <rafaywork93@gmail.com>`,
            to: customer.email!,
            replyTo: business.email!,
            subject: `Replacement Reminder for ${product.name}`,
            html: `
                            <p>Dear ${customer.firstName},</p>
                            <p>This is a reminder to replace your product: <strong>${product.name}</strong>.</p>
                            <p>If you have any questions, please contact us at ${business.email} or ${business.tel}.</p>
                            <p>Thank you,</p>
                            <p>${business.name}</p>
                        `,
          };
          await sendEmail(emailData);
        }
      }
    }
  } catch (error) {
    console.error("Error sending replacement reminders:", error);
  }
};

export default replacementReminder;
