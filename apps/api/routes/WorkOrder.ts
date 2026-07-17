const express = require("express");
const router = express.Router();
const {
  WorkOrder,
  Product,
  workorder_product,
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
  authorizePermission("workorder:read"),
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
        selectedFilters.status = {
          [Op.in]: status,
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
        const workorders = await WorkOrder.findAll({
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
              through: "workorder_product",
              include: ["Tax", "Category"],
            },
            {
              model: Business,
              as: "Business",
            },
          ],
        });

        return res.json({
          message: "Work orders fetched successfully (report)",
          data: workorders,
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await WorkOrder.findAndCountAll({
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
            through: "workorder_product",
            include: ["Tax", "Category"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });

      return res.json({
        message: "Work orders fetched successfully",
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
  authorizePermission("workorder:read"),
  async (req, res) => {
    try {
      const workorder = await WorkOrder.findByPk(req.params.id, {
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
            through: "workorder_product",
            include: ["Tax"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });

      if (!workorder) {
        return res.status(404).json({ message: "workorder not found" });
      }

      res.json(workorder);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/create",
  fetchUser,
  authorizePermission("workorder:create"),
  async (req, res) => {
    try {
      const workOrderData = req.body.workOrderData;
      if (!("CustomerId" in workOrderData)) {
        return res.status(409).json({ message: "Customer Id is mandatory" });
      }

      const newWorkOrder = await WorkOrder.create(workOrderData);
      if (req.body.products && req.body.products.length !== 0) {
        await Promise.all(
          req.body.products.map(async (product) => {
            const productRecord = await Product.findByPk(product.id);
            if (productRecord) {
              await newWorkOrder.addProduct(productRecord, {
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

      const currentWorkOrder = await WorkOrder.findByPk(newWorkOrder.id, {
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
            through: "workorder_product",
            include: ["Tax"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });

      return res.status(200).json({
        message: "WorkOrder created successfully",
        data: currentWorkOrder,
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
  authorizePermission("workorder:update"),
  async (req, res) => {
    try {
      const workorder = await WorkOrder.findByPk(req.params.id, {
        include: ["Product"],
      });

      if (!workorder) {
        return res.status(404).json({ message: "WorkOrder not found" });
      }

      if (req.body?.products && req.body?.products.length > 0) {
        try {
          await Promise.all(
            workorder.Product.map(async (product) => {
              await workorder.removeProduct(product);
            })
          );

          await Promise.all(
            req.body.products.map(async (product) => {
              const productRecord = await Product.findByPk(product.id);
              if (productRecord) {
                await workorder.addProduct(productRecord, {
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

      await workorder.update(req.body.workOrderData);

      const currentWorkOrder = await WorkOrder.findByPk(workorder.id, {
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
            through: "workorder_product",
            include: ["Tax"],
          },
          {
            model: Business,
            as: "Business",
          },
        ],
      });

      return res.status(200).json({
        message: "WorkOrder updated successfully",
        data: currentWorkOrder,
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
  authorizePermission("workorder:delete"),
  async (req, res) => {
    try {
      const workorder = await WorkOrder.findByPk(req.params.id);

      if (!workorder) {
        return res.status(404).json({ message: "workorder not found" });
      }

      await workorder.destroy();

      res.json({ message: "WorkOrder deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting workorder" });
    }
  }
);

module.exports = router;
