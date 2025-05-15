const express = require("express");
const router = express.Router();
const { Payment } = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();

router.get("/:invoiceId", fetchUser, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: {
        InvoiceId: req.params.invoiceId,
      },
      order: [["createdAt", "ASC"]],
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const paymentData = req.body;
    const newPayment = await Payment.create(paymentData);
    const invoice = await newPayment.getInvoice();
    const updatedInvoice = await invoice.update({
      paidAmount: invoice.paidAmount + newPayment.paidAmount,
    });
    await updatedInvoice.save();
    res.json(newPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "payment not found" });
    }

    await payment.update(req.body);

    res.json({ message: "Payment updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "address not found" });
    }

    await payment.destroy();

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

module.exports = router;
