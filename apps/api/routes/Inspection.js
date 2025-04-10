const express = require("express");
const router = express.Router();
const { Inspection } = require("../models"); // adjust path as needed

// Create
router.post("/create", async (req, res) => {
  try {
    const data = req.body;
    // const modifiedInspectionData = data.inspectionData.map(({ category, ...item }) => ({
    //     ...item,
    //     CustomerId: data.CustomerId,
    //     CustomerVehicleId: data.CustomerVehicleId,
    // }));

    const inspection = await Inspection.create(data);
    res.status(201).json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read all
router.get("/", async (req, res) => {
  try {
    const inspections = await Inspection.findAll({
      include: ["Customer", "CustomerVehicle"],
    });
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const inspection = await Inspection.findByPk(req.params.id, {
      include: ["Customer", "CustomerVehicle"],
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
    const inspection = await Inspection.findByPk(req.params.id);
    if (!inspection) return res.status(404).json({ error: "Not found" });

    await inspection.update(req.body);
    res.json(inspection);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete
router.delete("/delete/:id", async (req, res) => {
  try {
    const inspection = await Inspection.findByPk(req.params.id);
    if (!inspection) return res.status(404).json({ error: "Not found" });

    await inspection.destroy();
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
