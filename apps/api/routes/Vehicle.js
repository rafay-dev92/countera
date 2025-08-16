const express = require("express");
const router = express.Router();
const { Vehicle } = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();

router.get("/", fetchUser, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
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
    const existingVehicle = await Vehicle.findOne({
      where: { make: make, model: model },
    });

    if (existingVehicle) {
      return res.status(409).json({ message: "Vehicle already exists" });
    }
    await Vehicle.create({ make, model });
    return res.status(200).json({ message: "Vehicle added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    await vehicle.update(req.body);

    return res.status(200).json({ message: "Vehicle updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    await vehicle.destroy();
    return res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
});

router.post("/import", fetchUser, async (req, res) => {
  try {
    const vehicles = req.body.vehicles;
    for (const vehicle of vehicles) {
      const make = (vehicle.Make || "").toUpperCase();
      const model = (vehicle.Model || "").toUpperCase();
      const existingVehicle = await Vehicle.findOne({
        where: { make: make, model: model },
      });
      if (!existingVehicle) {
        await Vehicle.create({ make, model });
      }
    }
    return res.status(200).json({ message: "Vehicle uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading vehicles" });
  }
});

module.exports = router;
