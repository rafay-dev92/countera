import express from "express";
const router = express.Router();
import { db, customers, users } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, and, ne, isNotNull, desc } from "drizzle-orm";
import { UserRole } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

const customerIncludes = {
  Business: true,
  Address: true,
  Vehicle: true,
  Inspection: true,
} as const;

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
    if (user) {
      const customer = await db.query.customers.findMany({
        where: and(
          eq(customers.BusinessId, user.BusinessId!),
          eq(customers.isActive, true)
        ),
        orderBy: [desc(customers.createdAt)],
        with: customerIncludes,
      });
      return res.json(customer);
    }
    const customer = await db.query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
      with: customerIncludes,
    });
    return res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, req.params.id),
      with: customerIncludes,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    const customerData = req.body;
    const existingCustomer = await db.query.customers.findFirst({
      where: and(
        eq(customers.firstName, customerData.firstName),
        eq(customers.lastName, customerData.lastName),
        eq(customers.email, customerData.email),
        eq(customers.BusinessId, customerData.BusinessId)
      ),
    });

    if (existingCustomer) {
      return res
        .status(409)
        .json({ message: "Customer already exists with this email and name" });
    }

    const [customer] = await db
      .insert(customers)
      .values(pickColumns(customers, customerData))
      .returning();
    return res
      .status(200)
      .json({ message: "Customer added successfully", data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, req.params.id),
      with: { Address: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const updates = pickColumns(customers, req.body);
    let updated = existing;
    if (Object.keys(updates).length) {
      const [row] = await db
        .update(customers)
        .set(updates)
        .where(eq(customers.id, req.params.id))
        .returning();
      updated = { ...existing, ...row };
    }

    return res
      .status(200)
      .json({ message: "Customer updated successfully", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating customer" });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, req.params.id),
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await db.delete(customers).where(eq(customers.id, req.params.id));
    return res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Error deleting customer" });
  }
});

export default router;
