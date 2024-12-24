const express = require("express");
const router = express.Router();
const { Business, User } = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();
const multer = require("multer");
const { Op } = require("sequelize");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/business/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", fetchUser, async (req, res) => {
  try {
    const business = await Business.findAll({ include: ["User", "Customer"] });
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: ["User", "Customer"],
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json({ message: "business fetched", data: business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", upload.single("logo"), async (req, res) => {
  try {
    const {name, email, licenseNumber, permitNumber} = req.body;
    const existingBusiness = await Business.findOne({
      where: {
        [Op.or]: [
          { name },
          { email },
          { licenseNumber },
          { permitNumber },
        ],
      },
    });

    if (existingBusiness) {
      return res
        .status(409)
        .json({ message: "Business already exists" });
    }
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/business/${
        req.file.filename
      }`;
      req.body.logo = imageUrl;
    }
    const newBusiness = await Business.create(req.body);
    res.json(newBusiness);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", upload.single("logo"), async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "business not found" });
    }
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/business/${
        req.file.filename
      }`;
      req.body.logo = imageUrl;
    }
    await business.update(req.body);

    res.json({
      message: "Business updated successfully",
      data: await Business.findByPk(req.params.id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "business not found" });
    }

    await business.destroy();

    res.json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

module.exports = router;
