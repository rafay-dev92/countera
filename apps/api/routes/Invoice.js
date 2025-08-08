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
  InvoiceAudit,
  ArchivedInvoice,
} = require("../models");
const fetchUser = require("../middlewares/fetchUser");
const { Op, fn, where, col } = require("sequelize");
const moment = require("moment-timezone");

const {
  trackObjectChanges,
  trackProductChanges,
} = require("../utils/auditHelper");
const authorizePermission = require("../middlewares/authorizePermissions");
require("dotenv").config();

router.get(
  "/",
  fetchUser,
  authorizePermission("invoice:read"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, filters } = req.query;

      const parsedFilters = JSON.parse(filters);
      const {
        CustomerDetails,
        paymentStatus,
        startDate,
        endDate,
        isReport,
        order,
      } = parsedFilters;
      const selectedFilters = {};

      if (Array.isArray(paymentStatus) && paymentStatus.length > 0) {
        selectedFilters.paymentStatus = {
          [Op.in]: paymentStatus,
        };
      }

      let customers = null;
      if (
        CustomerDetails?.name &&
        typeof CustomerDetails.name === "string" &&
        CustomerDetails.name.trim() !== ""
      ) {
        customers = await Customer.findAll({
          where: where(fn("CONCAT", col("firstName"), " ", col("lastName")), {
            [Op.like]: `%${CustomerDetails.name.trim()}%`,
          }),
          attributes: ["id"],
        });
      }

      if (customers && customers.length > 0) {
        const customerIds = customers.map((customer) => customer.id);
        selectedFilters.CustomerId = { [Op.in]: customerIds };
      } else if (CustomerDetails?.name?.trim()) {
        // Name was entered but no customers found — force empty result
        selectedFilters.CustomerId = { [Op.in]: [null] };
      }

      if (startDate && endDate) {
        const parsedStartDate = moment.utc(startDate).toDate();
        const parsedEndDate = moment.utc(endDate).toDate();

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

      const sortOrder = order
        ? [["createdAt", order]]
        : [["createdAt", "DESC"]];
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
              as: "Products",
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
            as: "Products",
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
  }
);

router.get(
  "/:id",
  fetchUser,
  authorizePermission("invoice:read"),
  async (req, res) => {
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
            as: "Products",
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
  }
);

router.post(
  "/create",
  fetchUser,
  authorizePermission("invoice:create"),
  async (req, res) => {
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
                  price: product.price,
                  replacement_reminder_date: product.replacement_reminder_date
                    ? product.replacement_reminder_date
                    : null,
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
            as: "Products",
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
      return res.status(200).json({
        message: "Invoice created successfully",
        data: currentInvoice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/update/:id",
  fetchUser,
  authorizePermission("invoice:update"),
  async (req, res) => {
    try {
      let payload = req.body;
      const invoice = await Invoice.findByPk(req.params.id, {
        include: ["Products"],
      });

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (
        !(
          Object.keys(payload.invoiceData).length === 1 &&
          payload.invoiceData.hasOwnProperty("paymentStatus")
        )
      ) {
        // Track changes in invoice data
        if (req.body.invoiceData && req.body.products) {
          await trackObjectChanges(
            invoice.id,
            req.user.id,
            invoice.toJSON(),
            req.body.invoiceData,
            req.body.products
          );
        }
      }

      // Update invoice data
      if (req.body.invoiceData) {
        await invoice.update(req.body.invoiceData);
      }

      // Update products
      if (req.body?.products && req.body?.products.length > 0) {
        try {
          // Remove all existing products
          await Promise.all(
            invoice.Products.map(async (product) => {
              await invoice.removeProduct(product);
            })
          );

          // Add updated products
          await Promise.all(
            req.body.products.map(async (product) => {
              const productRecord = await Product.findByPk(product.id);
              if (productRecord) {
                await invoice.addProduct(productRecord, {
                  through: {
                    quantity: product.quantity,
                    description: product.description,
                    price: product.price,
                    replacement_reminder_date: product.replacement_reminder_date
                      ? product.replacement_reminder_date
                      : null,
                  },
                });
              }
            })
          );
        } catch (error) {
          console.error("Error updating products:", error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      }

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
            as: "Products",
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

      return res.status(200).json({
        message: "Invoice updated successfully",
        data: currentInvoice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/update-shadow/:id",
  fetchUser,
  authorizePermission("invoice:update"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findOne({
        where: {
          id: userId,
          role: { [Op.ne]: "super-admin" },
          BusinessId: { [Op.ne]: null },
        },
      });

      if (user.role !== "ADMIN")
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permission" });

      let payload = req.body;
      const invoice = await Invoice.findByPk(req.params.id, {
        include: [
          {
            model: Product,
            as: "Products",
            through: "invoice_product",
            include: ["Tax", "Category"],
          },
          "Business",
          {
            model: Payment,
            as: "Payments",
          },
        ],
      });

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if archived invoice already exists
      isArchivedInvoiceExists = await ArchivedInvoice.findOne({
        where: { originalInvoiceId: invoice.id },
      });

      if (isArchivedInvoiceExists) {
        return res.status(409).json({
          message: "Archived invoice already exists for this invoice",
        });
      }

      // create archived invoice
      const { id, Business, Payments, Products, ...restData } =
        invoice.dataValues;

      const payments = Payments.map((payment) => {
        const { id, ...restObj } = payment?.dataValues;
        return { ...restObj };
      });
      // Create archived invoice data
      const invoiceData = {
        originalInvoiceId: id,
        payments: JSON.stringify(payments),
        ...restData,
      };
      const newArchivedInvoice = await ArchivedInvoice.create(invoiceData);
      if (Products && Products.length !== 0) {
        await Promise.all(
          Products.map(async (product) => {
            if (product) {
              await newArchivedInvoice.addProduct(product, {
                through: {
                  quantity: product.invoice_product.quantity,
                  description: product.invoice_product.description,
                  price: product.invoice_product.price,
                  replacement_reminder_date: product.invoice_product
                    .replacement_reminder_date
                    ? product.invoice_product.replacement_reminder_date
                    : null,
                },
              });
            }
          })
        );
      }

      // get first cash payment
      const getFirstCashPayment = invoice.Payments.find(
        (payment) => payment.paymentMethod === "Cash"
      );

      // get Total amount of other payments
      const getOtherPaymentsAmount = invoice.Payments.reduce((acc, payment) => {
        if (payment.paymentMethod !== "Cash") {
          return acc + parseFloat(payment.paidAmount);
        }
        return acc;
      }, 0);

      // get payment difference
      const paymentDifference = (
        parseFloat(payload.invoiceData.totalAmount) - getOtherPaymentsAmount
      ).toFixed(2);

      // Update invoice data
      payload.invoiceData.paidAmount = payload.invoiceData.totalAmount;
      payload.invoiceData.isArchived = true;
      if (payload.invoiceData) {
        await invoice.update(payload.invoiceData);
      }

      // Update products
      if (payload?.products && payload?.products.length > 0) {
        try {
          // Remove all existing products
          await Promise.all(
            invoice.Products.map(async (product) => {
              await invoice.removeProduct(product);
            })
          );

          // Add updated products
          await Promise.all(
            payload.products.map(async (product) => {
              const productRecord = await Product.findByPk(product.id);
              if (productRecord) {
                await invoice.addProduct(productRecord, {
                  through: {
                    quantity: product.quantity,
                    description: product.description,
                    price: product.price,
                    replacement_reminder_date: product.replacement_reminder_date
                      ? product.replacement_reminder_date
                      : null,
                  },
                });
              }
            })
          );
        } catch (error) {
          console.error("Error updating products:", error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      }

      // Update Payments
      if (parseInt(paymentDifference) !== 0) {
        // Delete all cash payments
        await Promise.all(
          invoice.Payments.filter(
            (payment) => payment.paymentMethod === "Cash"
          ).map((payment) => Payment.destroy({ where: { id: payment.id } }))
        );

        const paymentData = {
          InvoiceId: invoice.id,
          paidAmount: paymentDifference,
          totalAmount: paymentDifference,
          paymentMethod: "Cash",
          createdAt: getFirstCashPayment.createdAt,
          updatedAt: getFirstCashPayment.updatedAt,
        };

        // create a new cash payment
        await Payment.create(paymentData);
      }

      const currentInvoice = await Invoice.findByPk(invoice.id, {
        include: [
          {
            model: Customer,
            as: "Customer",
            include: ["Address", "Vehicle"],
          },
          "CustomerVehicle",
          {
            model: Product,
            as: "Products",
            through: "invoice_product",
            include: ["Tax"],
          },
          "Business",
          {
            model: Payment,
            as: "Payments",
          },
        ],
      });

      return res.status(200).json({
        message: "Invoice updated successfully",
        data: currentInvoice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete(
  "/delete/:id/:status",
  fetchUser,
  authorizePermission("invoice:delete"),
  async (req, res) => {
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
        if (invoice.paymentStatus === "REFUNDED") {
          return res.status(409).json({ message: "Invoice already refunded" });
        }
        if (invoice.paymentStatus === "VOIDED") {
          return res.status(409).json({ message: "Invoice already voided" });
        }
      }

      invoice.update({ paymentStatus: req.params.status });
      return res.status(200).json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting invoice" });
    }
  }
);

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

// Get invoice audit history
router.get("/audit/:id", fetchUser, async (req, res) => {
  try {
    // Validate invoice ID
    if (!req.params.id) {
      return res.status(400).json({
        message: "Invoice ID is required",
        data: [],
      });
    }

    // Check if invoice exists
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
        status: 404,
        data: [],
      });
    }

    const auditHistory = await InvoiceAudit.findAll({
      where: {
        invoiceId: req.params.id,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "first_name", "last_name", "email", "role"],
        },
      ],
    });

    return res.status(200).json({
      message: "Audit history retrieved successfully",
      status: 200,
      data: auditHistory || [],
    });
  } catch (error) {
    console.error("Error fetching audit history:", error);
    return res.status(200).json({
      message: "Unable to load audit history. Please try again later.",
      status: 500,
      data: [],
    });
  }
});

router.get("/today-reminders/:businessId", fetchUser, async (req, res) => {
  try {
    const business = await Business.findOne({
      attributes: ["id", "timezone"],
      where: {
        id: req.params.businessId,
      },
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
        status: 404,
        data: [],
      });
    }

    const todayInBusinessTz = moment()
      .tz(business.timezone || "UTC")
      .format("YYYY-MM-DD");

    const reminders = await invoice_product.findAll({
      where: {
        replacement_reminder_date: todayInBusinessTz,
      },
      include: [
        {
          model: Invoice,
          as: "Invoice",
          where: {
            BusinessId: business.id,
          },
          include: [
            {
              model: Customer,
              as: "Customer",
              include: [
                {
                  model: Business,
                  as: "Business",
                },
              ],
            },
          ],
        },
        {
          model: Product,
          as: "Product",
        },
      ],
    });

    return res.status(200).json({
      message: "Reminders fetched successfully",
      status: 200,
      data: reminders || [],
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return res.status(500).json({
      message: "Unable to get reminders. Please try again later.",
      status: 500,
      data: [],
    });
  }
});

module.exports = router;
