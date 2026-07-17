const express = require("express");
const router = express.Router();
const {
  Product,
  User,
  Customer,
  CustomerVehicle,
  Business,
  ArchivedInvoice,
} = require("../models");
const fetchUser = require("../middlewares/fetchUser");
const { Op } = require("sequelize");

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

    if (!user) {
      return res.status(404).json({ message: "User not found", data: [] });
    }

    const invoices = await ArchivedInvoice.findAll({
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
          as: "Products",
          through: "archived_invoice_product",
          include: ["Tax", "Category"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    return res.json({
      message: "Invoices fetched successfully",
      data: invoices,
    });

    //   return res.json({
    //     message: "Invoices fetched successfully",
    //     data: rows,
    //     total: count,
    //     page: Number(page),
    //     limit: Number(limit),
    //     totalPages: Math.ceil(count / limit),
    //   });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const invoice = await ArchivedInvoice.findByPk(req.params.id, {
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
          through: "archived_invoice_product",
          include: ["Tax"],
        },
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json({
      message: "Invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const invoice = await ArchivedInvoice.findByPk(req.params.id);

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
