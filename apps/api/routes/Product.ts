const express = require("express");
const router = express.Router();
const { Product, Tax, User, Product_Category } = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();
const multer = require("multer");
const { Op } = require("sequelize");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// routes below
router.get("/", fetchUser, async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
        role: { [Op.ne]: "super-admin" },
        BusinessId: { [Op.ne]: null },
      },
    });

    if (user) {
      const products = await Product.findAll({
        where: { BusinessId: user.dataValues.BusinessId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Tax,
            as: "Tax",
            through: "product_tax",
          },
          {
            model: Product_Category,
            as: "Category",
          },
        ],
      });
      return res.status(200).json(products);
    }

    const products = await Product.findAll({ 
      order: [["createdAt", "DESC"]],
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
      where: {
        [Op.or]: [
          { name: productData.name, BusinessId: productData.BusinessId },
          // {itemCode: productData.itemCode, BusinessId: productData.BusinessId}
        ],
      },
    });

    if (existingProduct) {
      return res.status(409).json({
        message: "Product with this name or item code already exists",
      });
    }
    if (req.file) {
      const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/products/${req.file.filename}`;
      productData.image = imageUrl;
    }

    productTaxes = JSON.parse(productData.taxes);
    delete productData.taxes;

    const newProduct = await Product.create(productData);
    if (productTaxes.length > 0 && productData.taxable) {
      await Promise.all(
        productTaxes.map(async (item) => {
          const tax = await Tax.findByPk(item);
          await newProduct.addTax(tax);
        })
      );
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
        return res.status(404).json({ message: "product not found" });
      }
      if (req.file) {
        const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/products/${req.file.filename}`;
        req.body.image = imageUrl;
      }
      await product.update(req.body);

      const deletedItems = product.Tax.filter(
        (originalTaxes) =>
          !JSON.parse(req.body.taxes).some(
            (item) => item === originalTaxes.dataValues.id
          )
      ).map((changeItem) => changeItem.dataValues.id);

      const addItems = JSON.parse(req.body.taxes).filter(
        (tax) => !product.Tax.some((item) => item.dataValues.id === tax)
      );

      if (addItems.length !== 0) {
        await Promise.all(
          addItems.map(async (item) => {
            const tax = await Tax.findByPk(item);
            await product.addTax(tax);
          })
        );
      }

      if (deletedItems.length !== 0) {
        await Promise.all(
          deletedItems.map(async (item) => {
            const tax = await Tax.findByPk(item);
            await product.removeTax(tax);
          })
        );
      }

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
