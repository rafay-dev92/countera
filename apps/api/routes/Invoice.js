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
    const userId = req.user.id;
    const user = await User.findOne({
      where: {
        id: userId,
        role: { [Op.ne]: "super-admin" },
        BusinessId: { [Op.ne]: null },
      },
    });

    if (user) {
      const invoices = await Invoice.findAll({
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
          {
            model: Payment,
            as: "Payments",
          }
        ],
      });
      return res.json({
        message: "Invoices fetched successfully",
        data: invoices,
      });
    }

    const invoices = await Invoice.findAll({
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
        {
          model: Payment,
          as: "Payments",
        }
      ],
    });
    return res.json({
      message: "Invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
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
    if (req.body.products.length !== 0) {
      await Promise.all(
        req.body.products.map(async (item) => {
          const product = await Product.findByPk(item.split(":")[0]);
          await newInvoice.addProduct(product, {
            through: { quantity: item.split(":")[1] },
          });
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
        }
      ],
    });
    return res.status(200).json({ message: "Invoice created successfully", data: currentInvoice });
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

    // if (invoice.dataValues.realInvoiceId === null) {
      // Update the status of original Invoice
      // if (invoice.dataValues.current) {
        // let oldInvoiceData = invoice.dataValues;
        // oldInvoiceData = { ...oldInvoiceData, current: false };
        // await invoice.update(invoice);
        
        // Create a new Invoice
        // invoiceData = {
        //   ...invoiceData,
        //   invoiceData: {
        //     ...invoiceData.invoiceData,
        //     current: true,
        //     realInvoiceId: oldInvoiceData.id,
        //   },
        // };
        // try {
          // const newInvoice = await Invoice.create(invoiceData.invoiceData);
          // if (invoiceData.products.length !== 0) {
          //   invoiceData.products.map(async (item) => {
          //     const product = await Product.findByPk(item.split(":")[0]);
          //     await newInvoice.addProduct(product, {
          //       through: { quantity: item.split(":")[1] },
          //     });
          //   });
          // }
        //   return res
        //     .status(200)
        //     .json({ message: "Invoice updated successfully" });
        // } catch (error) {
        //   return res.status(500).json({ message: "Something went wrong" });
        // }
      // }
      // return res.status(409).json({ message: "Invoice updated successfully" });
    // }

    if (req.body?.products.length !== 0) {
      try {
        req.body.products.forEach(async (newProduct) => {
          const productId = newProduct.split(":")[0];
          const newQuantity = newProduct.split(":")[1];

          // Check if the product exists in the current products
          const existingProduct = invoice.Product.find(
            (currentProduct) => currentProduct.dataValues.id === productId
          );

          if (existingProduct) {
            // If the product exists, update the quantity in the junction table
            await invoice_product.update(
              { quantity: newQuantity },
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
            });
          }
        });
      } catch (error) {
        return res.status(500).json({ message: "Internel Server Error" });
      }

      const deletedItems = invoice.Product.filter(
        (orgProd) =>
          !req.body.products.some(
            (item) => item.split(":")[0] === orgProd.dataValues.id
          )
      ).map((changeItem) => changeItem.dataValues.id);

      if (deletedItems.length !== 0) {
        await Promise.all(
          deletedItems.map(async (item) => {
            const product = await Product.findByPk(item.split(":")[0]);
            await invoice.removeProduct(product);
          })
        );
      }

      // const addItems = req.body.products.filter(prod =>
      //     !invoice.Product.some(item => item.dataValues.id === prod.split(':')[0]));

      // if (addItems.length !== 0) {
      //     addItems.forEach(async (item) => {
      //         const product = await Product.findByPk(item.split(':')[0]);
      //         await invoice.addProduct(product, { through: { quantity: item.split(':')[1] } });
      //     });
      // }
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
        }
      ],
    });

    return res.status(200).json({ message: "Invoice updated successfully", data: currentInvoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
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
