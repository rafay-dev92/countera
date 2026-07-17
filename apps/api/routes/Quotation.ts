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
const { Op, fn, col, where } = require("sequelize");
const authorizePermission = require("../middlewares/authorizePermissions");
const moment = require("moment");
require("dotenv").config();

router.get(
  "/",
  fetchUser,
  authorizePermission("quote:read"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, filters } = req.query;

      const parsedFilters = JSON.parse(filters || '{}');
      const {
        CustomerDetails,
        status,
        startDate,
        endDate,
        isReport,
        order,
      } = parsedFilters;
      const selectedFilters = {};

      if (Array.isArray(status) && status.length > 0) {
        selectedFilters.approved = {
          [Op.in]: status.map(s => s === 'APPROVED'),
        };
      }

      let customers = null;
      if (
        (CustomerDetails?.name &&
          typeof CustomerDetails?.name === "string" &&
          CustomerDetails?.name?.trim() !== "") ||
        CustomerDetails?.id
      ) {
        customers = await Customer.findAll({
          where: where(fn("CONCAT", col("firstName"), " ", col("lastName")), {
            [Op.like]: `%${CustomerDetails?.name?.trim()}%`,
          }),
          attributes: ["id"],
        });
      }

      if (customers && customers.length > 0) {
        const customerIds = customers.map((customer) => customer.id);
        selectedFilters.CustomerId = { [Op.in]: customerIds };
      } else if (CustomerDetails?.id) {
        const customerId = CustomerDetails.id;
        selectedFilters.CustomerId = { [Op.in]: [customerId] };
      }
      else if (CustomerDetails?.name?.trim()) {
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
        const quotations = await Quotation.findAll({
          where: whereCondition,
          order: sortOrder,
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
              through: "quotation_product",
              include: ["Tax", "Category"],
            },
            {
              model: Business,
              as: "Business",
            },
          ],
        });

        return res.json({
          message: "Quotations fetched successfully (report)",
          data: quotations,
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Quotation.findAndCountAll({
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
            through: "quotation_product",
            include: ["Tax", "Category"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });

      return res.json({
        message: "Quotations fetched successfully",
        data: rows,
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/:id",
  fetchUser,
  authorizePermission("quote:read"),
  async (req, res) => {
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
  }
);

router.post(
  "/create",
  fetchUser,
  authorizePermission("quote:create"),
  async (req, res) => {
    try {
      const quotationData = req.body.quotationData;
      if (!("CustomerId" in quotationData)) {
        return res.status(409).json({ message: "Customer Id is mandatory" });
      }

      const newQuotation = await Quotation.create(quotationData);
      if (req.body.products && req.body.products.length !== 0) {
        await Promise.all(
          req.body.products.map(async (product) => {
            const productRecord = await Product.findByPk(product.id);
            if (productRecord) {
              await newQuotation.addProduct(productRecord, {
                through: {
                  quantity: product.quantity,
                  description: product.description,
                  price: product.price,
                },
              });
            }
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
  }
);

router.put(
  "/update/:id",
  fetchUser,
  authorizePermission("quote:update"),
  async (req, res) => {
    try {
      const quotation = await Quotation.findByPk(req.params.id, {
        include: ["Product"],
      });

      if (!quotation) {
        return res.status(404).json({ message: "Quotataion not found" });
      }

      if (req.body?.products && req.body?.products.length > 0) {
        try {
          await Promise.all(
            quotation.Product.map(async (product) => {
              await quotation.removeProduct(product);
            })
          );

          await Promise.all(
            req.body.products.map(async (product) => {
              const productRecord = await Product.findByPk(product.id);
              if (productRecord) {
                await quotation.addProduct(productRecord, {
                  through: {
                    quantity: product.quantity,
                    description: product.description,
                    price: product.price,
                  },
                });
              }
            })
          );          
        } catch (error) {
          return res.status(500).json({ message: "Internel Server Error" });
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
            through: "quotation_product",
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
  }
);

router.delete(
  "/delete/:id",
  fetchUser,
  authorizePermission("quote:delete"),
  async (req, res) => {
    try {
      const quotataion = await Quotation.findByPk(req.params.id);

      if (!quotataion) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      await quotataion.destroy();

      return res
        .status(200)
        .json({ message: "Quotation deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting quotataion" });
    }
  }
);

module.exports = router;
