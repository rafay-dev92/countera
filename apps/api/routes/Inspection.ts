import express from "express";
const router = express.Router();
import { db, inspections } from "../db"; // adjust path as needed
import { pickColumns } from "../db/helpers";
import { eq } from "drizzle-orm";

// Create
router.post("/create", async (req, res) => {
  try {
    const data = req.body;
    // const modifiedInspectionData = data.inspectionData.map(({ category, ...item }) => ({
    //     ...item,
    //     CustomerId: data.CustomerId,
    //     CustomerVehicleId: data.CustomerVehicleId,
    // }));

    const [inspection] = await db
      .insert(inspections)
      .values(pickColumns(inspections, data))
      .returning();
    res.status(201).json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const inspectionRows = await db.query.inspections.findMany({
      with: { Customer: true, CustomerVehicle: true },
    });
    res.json(inspectionRows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const inspection = await db.query.inspections.findFirst({
      where: eq(inspections.id, req.params.id),
      with: { Customer: true, CustomerVehicle: true },
    });
    if (!inspection) return res.status(404).json({ error: "Not found" });
    res.json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put("/update/:id", async (req, res) => {
  try {
    const inspection = await db.query.inspections.findFirst({
      where: eq(inspections.id, req.params.id),
    });
    if (!inspection) return res.status(404).json({ error: "Not found" });

    const updates = pickColumns(inspections, req.body);
    let updated = inspection;
    if (Object.keys(updates).length) {
      const [row] = await db
        .update(inspections)
        .set(updates)
        .where(eq(inspections.id, req.params.id))
        .returning();
      updated = row;
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete
router.delete("/delete/:id", async (req, res) => {
  try {
    const inspection = await db.query.inspections.findFirst({
      where: eq(inspections.id, req.params.id),
    });
    if (!inspection) return res.status(404).json({ error: "Not found" });

    await db.delete(inspections).where(eq(inspections.id, req.params.id));
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
