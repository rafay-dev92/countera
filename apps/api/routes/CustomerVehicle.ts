import express from "express";
const router = express.Router();
import { db, customer_vehicles } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, desc } from "drizzle-orm";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

router.get("/customer/:id", fetchUser, async (req, res) => {
  try {
    const vehicles = await db.query.customer_vehicles.findMany({
      where: eq(customer_vehicles.CustomerId, req.params.id),
      orderBy: [desc(customer_vehicles.createdAt)],
    });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await db.query.customer_vehicles.findFirst({
      where: eq(customer_vehicles.id, req.params.id),
    });
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    let data = req.body;
    await db.insert(customer_vehicles).values(pickColumns(customer_vehicles, data));
    return res.status(200).json({ message: "Vehicle added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await db.query.customer_vehicles.findFirst({
      where: eq(customer_vehicles.id, req.params.id),
    });

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    const updates = pickColumns(customer_vehicles, req.body);
    if (Object.keys(updates).length) {
      await db
        .update(customer_vehicles)
        .set(updates)
        .where(eq(customer_vehicles.id, req.params.id));
    }

    return res.status(200).json({ message: "Vehicle updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await db.query.customer_vehicles.findFirst({
      where: eq(customer_vehicles.id, req.params.id),
    });

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    await db.delete(customer_vehicles).where(eq(customer_vehicles.id, req.params.id));
    return res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
});

export default router;
