import express from "express";
const router = express.Router();
import { db, invoices, users } from "../db";
import fetchUser from "../middlewares/fetchUser";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";
import moment from "moment";
import "dotenv/config";

router.get("/monthly", fetchUser, async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      with: { Business: true },
    });

    if (!user || !user.Business) {
      return res.status(404).json({ message: "User or business not found" });
    }

    const month = sql<number>`extract(month from ${invoices.createdAt})::int`;
    const salesData = await db
      .select({
        month: month.as("month"),
        totalSales: sql<number>`sum(${invoices.paidAmount})`.as("totalSales"),
      })
      .from(invoices)
      .where(
        and(
          inArray(invoices.paymentStatus, ["PAID", "PARTIALLY_PAID"]),
          eq(invoices.BusinessId, user.Business.id),
          gte(invoices.createdAt, moment().startOf("year").toDate()),
          lte(invoices.createdAt, moment().endOf("year").toDate())
        )
      )
      .groupBy(sql`month`)
      .orderBy(sql`month asc`);

    // Prepare an array for all 12 months (initialize with 0)
    const monthlyTotals: (number | string)[] = Array(12).fill(0);

    salesData.forEach((entry) => {
      const monthIndex = entry.month - 1;
      monthlyTotals[monthIndex] = (Number(entry.totalSales) / 1000).toFixed(2);
    });

    const months = moment.monthsShort(); // ['Jan', 'Feb', ..., 'Dec']

    return res.json({
      months,
      values: monthlyTotals,
    });
  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
