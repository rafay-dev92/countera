const express = require("express");
const router = express.Router();
const {
  Quotation,
  Product,
  quotation_product,
  User,
  Customer,
  CustomerVehicle,
  Business,
} = require("../models");
const fetchUser = require("../middlewares/fetchUser");
const { Op } = require("sequelize");
require("dotenv").config();

router.get("/", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findOne({
      where: {
        id: userId,
        role: { [Op.ne]: "super-admin" },
        BusinessId: { [Op.ne]: null },
      },
    });

    if (user) {
      const quotataions = await Quotation.findAll({
        where: { BusinessId: user.dataValues.BusinessId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Customer,
            as: "Customer",
            include: ["Address", "Vehicle"],
          },
          {
            model: CustomerVehicle,
            as: "CustomerVehicle",
          },
          {
            model: Product,
            as: "Product",
            through: "invoice_product",
            include: ["Tax"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });
      return res.json(quotataions);
    }

    const quotataions = await Quotation.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "invoice_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });
    return res.json(quotataions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const quotataion = await Quotation.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "invoice_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    if (!quotataion) {
      return res.status(404).json({ message: "quotataion not found" });
    }

    res.json(quotataion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    const quotationData = req.body.quotationData;
    if (!("CustomerId" in quotationData)) {
      return res.status(409).json({ message: "Customer Id is mandatory" });
    }

    const newQuotation = await Quotation.create(quotationData);
    if (req.body.products.length !== 0) {
      await Promise.all(
        req.body.products.map(async (item) => {
          const product = await Product.findByPk(item.split(":")[0]);
          await newQuotation.addProduct(product, {
            through: { quantity: item.split(":")[1] },
          });
        })
      );
    }

    const currentQuotation = await Quotation.findByPk(newQuotation.id, {
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "invoice_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    return res.status(200).json({
      message: "Quotation created successfully",
      data: currentQuotation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id, {
      include: ["Product"],
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotataion not found" });
    }

    if (req.body?.products && req.body?.products.length > 0) {
      try {
        req.body.products.forEach(async (newProduct) => {
          const productId = newProduct.split(":")[0];
          const newQuantity = newProduct.split(":")[1];

          // Check if the product exists in the current products
          const existingProduct = quotation.Product.find(
            (currentProduct) => currentProduct.dataValues.id === productId
          );

          if (existingProduct) {
            // If the product exists, update the quantity in the junction table
            const res = await quotation_product.update(
              { quantity: newQuantity },
              {
                where: {
                  QuotationId: quotation.id,
                  ProductId: productId,
                },
              }
            );
          } else {
            // If the product doesn't exist, add a new entry to the junction table
            const res = await quotation_product.create({
              QuotationId: quotation.id,
              ProductId: productId,
              quantity: newQuantity,
            });
          }
        });
      } catch (error) {
        return res.status(500).json({ message: "Internel Server Error" });
      }

      const deletedItems = quotation.Product.filter(
        (orgProd) =>
          !req.body.products.some(
            (item) => item.split(":")[0] === orgProd.dataValues.id
          )
      ).map((changeItem) => changeItem.dataValues.id);

      if (deletedItems.length !== 0) {
        await Promise.all(
          deletedItems.map(async (item) => {
            const product = await Product.findByPk(item.split(":")[0]);
            await quotation.removeProduct(product);
          })
        );
      }
    }

    await quotation.update(req.body.quotationData);

    const currentQuotation = await Quotation.findByPk(quotation.id, {
      include: [
        {
          model: Customer,
          as: "Customer",
          include: ["Address", "Vehicle"],
        },
        {
          model: CustomerVehicle,
          as: "CustomerVehicle",
        },
        {
          model: Product,
          as: "Product",
          through: "invoice_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    return res.status(200).json({
      message: "Quotation updated successfully",
      data: currentQuotation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const quotataion = await Quotation.findByPk(req.params.id);

    if (!quotataion) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    await quotataion.destroy();

    return res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting quotataion" });
  }
});

module.exports = router;
