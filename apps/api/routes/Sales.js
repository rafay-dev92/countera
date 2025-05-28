const express = require("express");
const router = express.Router();
const {
  Invoice,
  User,
  Business,
} = require("../models");
const fetchUser = require("../middlewares/fetchUser");
const { Op, fn, col, literal } = require("sequelize");
const moment = require("moment");
require("dotenv").config();

router.get("/monthly", fetchUser, async (req, res) => {
  try {
    const currentYear = moment().year();
    const user = await User.findOne({
      where: { id: req.user.id },
      include: [{
        model: Business,
        as: 'Business'
      }]
    });

    if (!user || !user.Business) {
      return res.status(404).json({ message: "User or business not found" });
    }
    const salesData = await Invoice.findAll({
      attributes: [
        [fn('MONTH', col('createdAt')), 'month'],
        [fn('SUM', col('paidAmount')), 'totalSales'],
      ],
      where: {
        paymentStatus: { [Op.in]: ['Paid', 'Partially Paid'] },
        BusinessId: user.Business.id,
        createdAt: {
          [Op.gte]: moment().startOf('year').toDate(),
          [Op.lte]: moment().endOf('year').toDate(),
        },
      },
      group: [literal('month')],
      order: [[literal('month'), 'ASC']],
      raw: true,
    });

    // Prepare an array for all 12 months (initialize with 0)
    const monthlyTotals = Array(12).fill(0);

    salesData.forEach((entry) => {
      const monthIndex = entry.month - 1;
      monthlyTotals[monthIndex] = parseFloat(entry.totalSales / 1000).toFixed(2);
    });

    const months = moment.monthsShort(); // ['Jan', 'Feb', ..., 'Dec']

    return res.json({
      months,
      values: monthlyTotals,
    });
  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
