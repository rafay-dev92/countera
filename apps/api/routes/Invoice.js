const express = require("express");
const router = express.Router();
const {
  Invoice,
  Product,
  invoice_product,
  User,
  Customer,
  CustomerVehicle,
  Business,
  Payment,
} = require("../models");
const fetchUser = require("../middlewares/fetchUser");
const { Op } = require("sequelize");
require("dotenv").config();

router.get("/", fetchUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, filters } = req.query;

    const parsedFilters = JSON.parse(filters);
    const { CustomerId, paymentStatus, startDate, endDate, isReport, order } =
      parsedFilters;
    const selectedFilters = {};

    if (Array.isArray(paymentStatus) && paymentStatus.length > 0) {
      selectedFilters.paymentStatus = {
        [Op.in]: paymentStatus,
      };
    }
    if (CustomerId) selectedFilters.CustomerId = CustomerId;

    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (!isNaN(parsedStartDate) && !isNaN(parsedEndDate)) {
        selectedFilters.createdAt = {
          [Op.gte]: parsedStartDate,
          [Op.lte]: parsedEndDate,
        };
      }
    }

    const userId = req.user.id;
    const user = await User.findOne({
      where: {
        id: userId,
        role: { [Op.ne]: "super-admin" },
        BusinessId: { [Op.ne]: null },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found", data: [] });
    }

    const whereCondition = {
      ...selectedFilters,
      BusinessId: user.BusinessId,
    };

    const sortOrder = order ? [["createdAt", order]] : [["createdAt", "DESC"]];
    const parsedIsReport = isReport ? true : false;

    if (parsedIsReport) {
      const invoices = await Invoice.findAll({
        where: whereCondition,
        order: sortOrder,
        include: [
          {
            model: Customer,
            as: "Customer",
            include: ["Address", "Vehicle"],
          },
          {
            model: Product,
            as: "Product",
            through: "invoice_product",
            include: ["Tax", "Category"],
          },
          {
            model: Payment,
            as: "Payments",
          },
        ],
      });

      return res.json({
        message: "Invoices fetched successfully (report)",
        data: invoices,
      });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Invoice.findAndCountAll({
      where: whereCondition,
      distinct: true,
      order: sortOrder,
      limit: Number(limit),
      offset: Number(offset),
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
          include: ["Tax", "Category"],
        },
        {
          model: Business,
          as: "Business",
        },
        {
          model: Payment,
          as: "Payments",
        },
      ],
    });

    return res.json({
      message: "Invoices fetched successfully",
      data: rows,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
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
        {
          model: Payment,
          as: "Payments",
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json({
      message: "Invoices fetched successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    const invoiceData = req.body.invoiceData;

    if (!("CustomerId" in invoiceData)) {
      return res.status(409).json({ message: "Customer Id is mandatory" });
    }

    const newInvoice = await Invoice.create(invoiceData);
    if (req.body.products && req.body.products.length !== 0) {
      await Promise.all(
        req.body.products.map(async (product) => {
          const productRecord = await Product.findByPk(product.id);
          if (productRecord) {
            await newInvoice.addProduct(productRecord, {
              through: { 
                quantity: product.quantity,
                description: product.description,
                price: product.price
              },
            });
          }
        })
      );
    }

    const currentInvoice = await Invoice.findByPk(newInvoice.id, {
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
        {
          model: Payment,
          as: "Payments",
        },
      ],
    });
    return res
      .status(200)
      .json({ message: "Invoice created successfully", data: currentInvoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    let invoiceData = req.body;
    const invoice = await Invoice.findByPk(req.params.id, {
      include: ["Product"],
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
   
    if (req.body?.products && req.body?.products.length > 0) {
      try {        
        req.body.products.forEach(async (newProduct) => {
          const productId = newProduct.id;
          const newQuantity = newProduct.quantity;
          const newDescription = newProduct.description;
          const newPrice = newProduct.price;

          // Check if the product exists in the current products
          const existingProduct = invoice.Product.find(
            (currentProduct) => currentProduct.dataValues.id === productId
          );

          if (existingProduct) {
            // If the product exists, update the quantity in the junction table
            await invoice_product.update(
              { quantity: newQuantity, description: newDescription, price: newPrice },
              {
                where: {
                  InvoiceId: invoice.id,
                  ProductId: productId,
                },
              }
            );
          } else {
            // If the product doesn't exist, add a new entry to the junction table
            await invoice_product.create({
              InvoiceId: invoice.id,
              ProductId: productId,
              quantity: newQuantity,
              description: newDescription,
              price: newPrice,
            });
          }
        });
      } catch (error) {
        return res.status(500).json({ message: "Internel Server Error" });
      }

      const deletedItems = invoice.Product.filter(
        (orgProd) =>
          !req.body.products.some(
            (item) => item.id === orgProd.dataValues.id
          )
      ).map((changeItem) => changeItem.dataValues.id);

      if (deletedItems.length !== 0) {
        await Promise.all(
          deletedItems.map(async (item) => {
            const product = await Product.findByPk(item.id);
            await invoice.removeProduct(product);
          })
        );
      }
    }

    await invoice.update(req.body.invoiceData);

    const currentInvoice = await Invoice.findByPk(invoice.id, {
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
        {
          model: Payment,
          as: "Payments",
        },
      ],
    });

    return res
      .status(200)
      .json({ message: "Invoice updated successfully", data: currentInvoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id/:status", fetchUser, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        {
          model: Payment,
          as: "Payments",
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ message: "invoice not found" });
    }

    if (invoice.Payments.length > 0) {
      try {
        await Promise.all(
          invoice.Payments.map(async (item) => {
            const paymemt = await Payment.findByPk(item.id);
            await paymemt.destroy();
          })
        );
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ message: "Error deleting invoice payments" });
      }
    } else {
      if (invoice.paymentStatus === "Refund") {
        return res.status(409).json({ message: "Invoice already refunded" });
      }
      if (invoice.paymentStatus === "Void") {
        return res.status(409).json({ message: "Invoice already voided" });
      }
    }

    invoice.update({ paymentStatus: req.params.status });
    return res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "invoice not found" });
    }

    await invoice.destroy();

    return res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

module.exports = router;
