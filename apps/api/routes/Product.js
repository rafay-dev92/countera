const express = require("express");
const router = express.Router();
const { Product, Tax } = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// routes below
router.get("/", fetchUser, async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Tax,
          as: "Tax",
          through: "product_tax",
        },
      ],
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Tax,
          as: "Tax",
          through: "product_tax",
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;
    const existingProduct = await Product.findOne({
      where: { name: productData.name },
    });

    if (existingProduct) {
      return res
        .status(409)
        .json({ message: "Product with this name already exists" });
    }
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/products${
        req.file.filename
      }`;
      productData.image = imageUrl;
    }

    productTaxes = JSON.parse(productData.taxes);
    delete productData.taxes;
    console.log("product data: ", productData);

    const newProduct = await Product.create(productData);
    if (productTaxes.length > 0 && productData.taxable) {
      productTaxes.map(async (item) => {
        const tax = await Tax.findByPk(item);
        await newProduct.addTax(tax);
      });
    }
    return res.status(200).json({ message: "Product added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put(
  "/update/:id",
  fetchUser,
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "product not found" });
      }
      if (req.file) {
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`;
        req.body.image = imageUrl;
      }
      await product.update(req.body);

      return res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    await product.destroy();

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

module.exports = router;
