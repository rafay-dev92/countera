const express = require("express");
const router = express.Router();
const {
  Package,
  Product,
  package_product,
  User,
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
      const packages = await Package.findAll({
        where: { BusinessId: user.dataValues.BusinessId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Product,
            as: "Product",
            through: "package_product",
            include: ["Tax", "Category"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });
      return res.json({
        message: "Packages fetched successfully",
        data: packages,
      });
    }

    const packages = await Package.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Product,
          as: "Product",
          through: "package_product",
          include: ["Tax", "Category"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });
    return res.json({
      message: "Packages fetched successfully",
      data: packages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: "Product",
          through: "package_product",
          include: ["Tax", "Category"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    if (!package) {
      return res.status(404).json({ message: "Package not found" });
    }

    return res.json({
      message: "Package fetched successfully",
      data: package,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    const packageData = req.body.packageData;

    const newPackage = await Package.create(packageData);
    if (req.body.products.length !== 0) {
      await Promise.all(
        req.body.products.map(async (item) => {
          const product = await Product.findByPk(item.split(":")[0]);
          await newPackage.addProduct(product, {
            through: { quantity: item.split(":")[1] },
          });
        })
      );
    }

    const currentPackage = await Package.findByPk(newPackage.id, {
      include: [
        {
          model: Product,
          as: "Product",
          through: "package_product",
          include: ["Tax", "Category"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });
    return res
      .status(200)
      .json({ message: "Package created successfully", data: currentPackage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    let packageData = req.body.packageData;
    const package = await Package.findByPk(req.params.id, {
      include: ["Product"],
    });

    if (!package) {
      return res.status(404).json({ message: "Package not found" });
    }

    if (req.body?.products && req.body?.products.length > 0) {
      try {
        req.body.products.forEach(async (newProduct) => {
          const productId = newProduct.split(":")[0];
          const newQuantity = newProduct.split(":")[1];

          const existingProduct = package.Product.find(
            (currentProduct) => currentProduct.dataValues.id === productId
          );

          if (existingProduct) {
            await package_product.update(
              { quantity: newQuantity },
              {
                where: {
                  PackageId: package.id,
                  ProductId: productId,
                },
              }
            );
          } else {
            // If the product doesn't exist, add a new entry to the junction table
            await package_product.create({
              PackageId: package.id,
              ProductId: productId,
              quantity: newQuantity,
            });
          }
        });
      } catch (error) {
        return res.status(500).json({ message: "Internel Server Error" });
      }

      const deletedItems = package.Product.filter(
        (orgProd) =>
          !req.body.products.some(
            (item) => item.split(":")[0] === orgProd.dataValues.id
          )
      ).map((changeItem) => changeItem.dataValues.id);

      if (deletedItems.length !== 0) {
        await Promise.all(
          deletedItems.map(async (item) => {
            const product = await Product.findByPk(item.split(":")[0]);
            await package.removeProduct(product);
          })
        );
      }
    }

    await package.update(packageData);

    const currentPackage = await Package.findByPk(package.id, {
        include: [
            {
              model: Product,
              as: "Product",
              through: "package_product",
              include: ["Tax", "Category"],
            },
            {
              model: Business,
              as: "Business",
            },
          ],
    });

    return res
      .status(200)
      .json({ message: "Package updated successfully", data: currentPackage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id);

    if (!package) {
      return res.status(404).json({ message: "package not found" });
    }

    await package.destroy();

    return res.status(200).json({ message: "package deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting package" });
  }
});

module.exports = router;
