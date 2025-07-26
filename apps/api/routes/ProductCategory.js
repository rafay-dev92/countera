const express = require("express");
const router = express.Router();
const { Product_Category, User, Business } = require("../models");
const fetchUser = require("../middlewares/fetchUser");
require("dotenv").config();

// routes below
router.get("/", fetchUser, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      include: [
        {
          model: Business,
          as: "Business",
        },
      ],
    });

    if (!user || !user.Business) {
      return res.status(404).json({ message: "User or business not found" });
    }

    const products_categories = await Product_Category.findAll({
      where: {
        BusinessId: user.Business.id,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(products_categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.get("/:id", fetchUser, async (req, res) => {
//   try {
//     const product = await Product.findByPk(req.params.id, {
//       include: [
//         {
//           model: Tax,
//           as: "Tax",
//           through: "product_tax",
//         },
//       ],
//     });

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.status(200).json(product);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

router.post("/create", fetchUser, async (req, res) => {
  try {
    const categoryData = req.body;

    const existingCategory = await Product_Category.findOne({
      where: { name: categoryData.name, BusinessId: categoryData.BusinessId },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category with this name already exists",
      });
    }

    await Product_Category.create(categoryData);
    return res.status(200).json({ message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const category = await Product_Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }
    await category.update(req.body);

    return res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const category = await Product_Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }

    await category.destroy();

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

module.exports = router;
