import express from "express";
const router = express.Router();
import { db, vehicles } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, and } from "drizzle-orm";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

router.get("/", fetchUser, async (req, res) => {
  try {
    const vehicleRows = await db.query.vehicles.findMany();
    res.status(200).json(vehicleRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, req.params.id),
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
    let { make, model } = req.body;
    make = make.toUpperCase();
    model = model.toUpperCase();
    const existingVehicle = await db.query.vehicles.findFirst({
      where: and(eq(vehicles.make, make), eq(vehicles.model, model)),
    });

    if (existingVehicle) {
      return res.status(409).json({ message: "Vehicle already exists" });
    }
    await db.insert(vehicles).values({ make, model });
    return res.status(200).json({ message: "Vehicle added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, req.params.id),
    });

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    const updates = pickColumns(vehicles, req.body);
    if (Object.keys(updates).length) {
      await db
        .update(vehicles)
        .set(updates)
        .where(eq(vehicles.id, req.params.id));
    }

    return res.status(200).json({ message: "Vehicle updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, req.params.id),
    });

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    await db.delete(vehicles).where(eq(vehicles.id, req.params.id));
    return res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
});

router.post("/import", fetchUser, async (req, res) => {
  try {
    const vehicleList = req.body.vehicles;
    for (const vehicle of vehicleList) {
      const make = (vehicle.Make || "").toUpperCase();
      const model = (vehicle.Model || "").toUpperCase();
      const existingVehicle = await db.query.vehicles.findFirst({
        where: and(eq(vehicles.make, make), eq(vehicles.model, model)),
      });
      if (!existingVehicle) {
        await db.insert(vehicles).values({ make, model });
      }
    }
    return res.status(200).json({ message: "Vehicle uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading vehicles" });
  }
});

export default router;
