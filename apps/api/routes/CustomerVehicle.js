const express = require("express");
const router = express.Router();
const { CustomerVehicle } = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();

router.get("/customer/:id", fetchUser, async (req, res) => {
  try {
    const vehicles = await CustomerVehicle.findAll({
      where: { CustomerId: req.params.id },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findByPk(req.params.id);
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
    const { vehicle, year, CustomerId } = req.body;
    let [make, model] = vehicle.split(" ");
    make = make.trim();
    model = model.trim();
    const existingVehicle = await CustomerVehicle.findOne({
      where: { make: make, model: model, year: year, CustomerId: CustomerId },
    });
    if (existingVehicle) {
      return res.status(409).json({ message: "Vehicle already exists" });
    }

    data = { ...data, make, model };
    delete data.vehicle;
    await CustomerVehicle.create(data);
    return res.status(200).json({ message: "Vehicle added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const vehicle = await CustomerVehicle.findByPk(req.params.id);

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
    const vehicle = await CustomerVehicle.findByPk(req.params.id);

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

module.exports = router;
