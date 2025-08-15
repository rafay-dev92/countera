const express = require("express");
const router = express.Router();
const {
  Business,
  Tax,
  Product,
  Package,
  Invoice,
  Quotation,
  WorkOrder,
  Customer,
  Product_Category,
  sequelize,
} = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();
const multer = require("multer");
const { Op, Transaction } = require("sequelize");
const getDefaultPackages = require("../data/default-packages");
const getDefaultProducts = require("../data/default-products");
const defaultTandCs = require("../data/defaultT&Cs");

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
    const businessData = req.body;
    const transaction = await sequelize.transaction();

    const { name, email, licenseNumber, permitNumber } = businessData;
    const existingBusiness = await Business.findOne({
      where: {
        [Op.or]: [
          { name },
          { email },
          // { licenseNumber },
          // { permitNumber },
        ],
      },
    });

    if (existingBusiness) {
      return res.status(409).json({ message: "Business already exists" });
    }
    if (req.file) {
      const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/business/${req.file.filename}`;
      businessData.logo = imageUrl;
    }

    businessData.termsAndConditions = defaultTandCs();

    const newBusiness = await Business.create(businessData, {
      transaction,
    });

    const defaultTaxes = await Tax.bulkCreate(
      [
        {
          name: "Sales Tax",
          type: "%",
          rate: 9.75,
          default: false,
          BusinessId: newBusiness.id,
        },
        {
          name: "CA Tire Tax",
          type: "$",
          rate: 1.75,
          default: false,
          BusinessId: newBusiness.id,
        },
        {
          name: "RECYCLE TIRES",
          type: "$",
          rate: 5,
          default: false,
          BusinessId: newBusiness.id,
        },
      ],
      { transaction }
    );

    const defaultCategories = await Product_Category.bulkCreate(
      [
        {
          name: "Recycle Items",
          description: "Recycle Items",
          BusinessId: newBusiness.id,
        },
        {
          name: "Labor",
          description: "All kind of Labor Category",
          BusinessId: newBusiness.id,
        },
        {
          name: "Wheels",
          description: "All kind of Wheels Category",
          BusinessId: newBusiness.id,
        },
        {
          name: "Auto Part",
          description: "All Auto Part Should be in this category",
          BusinessId: newBusiness.id,
        },
        { name: "Used Tire", description: "", BusinessId: newBusiness.id },
        { name: "New Tire", description: "", BusinessId: newBusiness.id },
      ],
      { transaction }
    );

    // 3. Create Default Products
    const taxMap = {};
    for (const tax of defaultTaxes) {
      taxMap[tax.name] = tax.id;
    }

    const categoryMap = {};
    for (const cat of defaultCategories) {
      categoryMap[cat.name] = cat.id;
    }

    const productMap = {};
    const productTemplates = getDefaultProducts();

    for (const template of productTemplates) {
      const productData = {
        name: template.name,
        cost: template.cost,
        margin: template.margin,
        price: template.price,
        itemCode: template.itemCode,
        type: template.type,
        description: template.description,
        taxable: template.taxable,
        CategoryId: categoryMap[template.categoryName],
        BusinessId: newBusiness.id,
      };

      const newProduct = await Product.create(productData, {
        transaction,
      });
      productMap[template.name] = newProduct;

      if (template.taxable && template.taxNames?.length) {
        const taxIds = template.taxNames
          .map((name) => taxMap[name])
          .filter(Boolean);

        const taxRecords = await Tax.findAll({
          where: { id: taxIds },
          transaction,
        });
        for (const tax of taxRecords) {
          await newProduct.addTax(tax, { transaction });
        }
      }
    }

    // 4. Create Default Packages
    const productPackageTemplates = getDefaultPackages();

    for (const template of productPackageTemplates) {
      const packageData = {
        name: template.name,
        description: template.description,
        price: template.price,
        BusinessId: newBusiness.id,
      };

      const newPackage = await Package.create(packageData, {
        transaction,
      });

      if (template.products?.length) {
        await Promise.all(
          template.products.map(async (entry) => {
            const [productName, quantityStr] = entry.split(":");
            const product = productMap[productName];
            const quantity = parseInt(quantityStr, 10);

            if (!product || isNaN(quantity)) return;

            await newPackage.addProduct(product, {
              through: { quantity },
              transaction,
            });
          })
        );
      }
    }

    await transaction.commit();

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
      const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/business/${req.file.filename}`;
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

    const transaction = await sequelize.transaction();

    // Delete associated products, packages, and taxes
    await Invoice.destroy({ where: { BusinessId: business.id }, transaction });
    await Quotation.destroy({
      where: { BusinessId: business.id },
      transaction,
    });
    await WorkOrder.destroy({
      where: { BusinessId: business.id },
      transaction,
    });
    await Customer.destroy({ where: { BusinessId: business.id }, transaction });
    await Product.destroy({ where: { BusinessId: business.id }, transaction });
    await Package.destroy({ where: { BusinessId: business.id }, transaction });
    await Tax.destroy({ where: { BusinessId: business.id }, transaction });
    await business.destroy({ transaction });

    await transaction.commit();
    res.json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting business" });
  }
});

module.exports = router;
