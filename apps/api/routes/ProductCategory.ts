import express from "express";
const router = express.Router();
import { db, product_categories, users } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, ne, and, desc } from "drizzle-orm";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

// routes below
router.get("/", fetchUser, async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      with: { Business: true },
    });

    if (!user || !user.Business) {
      return res.status(404).json({ message: "User or business not found" });
    }

    const products_categories = await db.query.product_categories.findMany({
      where: eq(product_categories.BusinessId, user.Business.id),
      orderBy: [desc(product_categories.createdAt)],
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

    const existingCategory = await db.query.product_categories.findFirst({
      where: and(
        eq(product_categories.name, categoryData.name),
        eq(product_categories.BusinessId, categoryData.BusinessId)
      ),
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category with this name already exists",
      });
    }

    await db
      .insert(product_categories)
      .values(pickColumns(product_categories, categoryData));
    return res.status(200).json({ message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const category = await db.query.product_categories.findFirst({
      where: eq(product_categories.id, req.params.id),
    });

    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }

    const isExistingCategory = await db.query.product_categories.findFirst({
      where: and(
        eq(product_categories.name, req.body.name),
        eq(product_categories.BusinessId, req.body.BusinessId),
        ne(product_categories.id, req.params.id)
      ),
    });

    if (isExistingCategory) {
      return res.status(409).json({
        message: "Category with this name already exists",
      });
    }

    const updates = pickColumns(product_categories, req.body);
    if (Object.keys(updates).length) {
      await db
        .update(product_categories)
        .set(updates)
        .where(eq(product_categories.id, req.params.id));
    }

    return res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const category = await db.query.product_categories.findFirst({
      where: eq(product_categories.id, req.params.id),
    });

    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }

    await db
      .delete(product_categories)
      .where(eq(product_categories.id, req.params.id));

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

export default router;
