import express from "express";
const router = express.Router();
import { db, products, users, product_tax } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, and, ne, isNotNull, inArray, desc } from "drizzle-orm";
import { UserRole } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// flatten the product_tax join rows back into the old Sequelize `Tax` alias
function withTaxAlias(product: any) {
  const { ProductTaxes, ...rest } = product;
  return {
    ...rest,
    Tax: ProductTaxes.map(({ Tax, ...product_tax }: any) => ({
      ...Tax,
      product_tax,
    })),
  };
}

// routes below
router.get("/", fetchUser, async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, req.user.id),
        ne(users.role, UserRole.SUPER_ADMIN),
        isNotNull(users.BusinessId)
      ),
    });

    if (user) {
      const productRows = await db.query.products.findMany({
        where: eq(products.BusinessId, user.BusinessId!),
        orderBy: [desc(products.createdAt)],
        with: {
          ProductTaxes: { with: { Tax: true } },
          Category: true,
        },
      });
      return res.status(200).json(productRows.map(withTaxAlias));
    }

    const productRows = await db.query.products.findMany({
      orderBy: [desc(products.createdAt)],
      with: {
        ProductTaxes: { with: { Tax: true } },
      },
    });
    res.status(200).json(productRows.map(withTaxAlias));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, req.params.id),
      with: {
        ProductTaxes: { with: { Tax: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(withTaxAlias(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// the middleware is runtime-identical, so bridge the type mismatch with a cast.
router.post("/create", fetchUser, upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;
    const existingProduct = await db.query.products.findFirst({
      where: and(
        eq(products.name, productData.name),
        eq(products.BusinessId, productData.BusinessId)
        // itemCode + BusinessId check intentionally disabled (was commented out)
      ),
    });

    if (existingProduct) {
      return res.status(409).json({
        message: "Product with this name or item code already exists",
      });
    }
    if (req.file) {
      const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/products/${req.file.filename}`;
      productData.image = imageUrl;
    }

    let productTaxes = JSON.parse(productData.taxes);
    delete productData.taxes;

    const [newProduct] = await db
      .insert(products)
      .values(pickColumns(products, productData))
      .returning();
    if (productTaxes.length > 0 && productData.taxable) {
      await db.insert(product_tax).values(
        productTaxes.map((item: any) => ({
          ProductId: newProduct.id,
          TaxId: item,
        }))
      );
    }
    return res.status(200).json({ message: "Product added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put(
  "/update/:id",
  fetchUser,
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await db.query.products.findFirst({
        where: eq(products.id, req.params.id),
        with: {
          ProductTaxes: { with: { Tax: true } },
        },
      });

      if (!product) {
        return res.status(404).json({ message: "product not found" });
      }
      if (req.file) {
        const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/products/${req.file.filename}`;
        req.body.image = imageUrl;
      }
      const updates = pickColumns(products, req.body);
      if (Object.keys(updates).length) {
        await db
          .update(products)
          .set(updates)
          .where(eq(products.id, req.params.id));
      }

      (product as any).Tax = product.ProductTaxes.map(({ Tax }) => Tax);

      const deletedItems = (product as any).Tax.filter(
        (originalTaxes: any) =>
          !JSON.parse(req.body.taxes).some(
            (item: any) => item === originalTaxes.id
          )
      ).map((changeItem: any) => changeItem.id);

      const addItems = JSON.parse(req.body.taxes).filter(
        (tax: any) => !(product as any).Tax.some((item: any) => item.id === tax)
      );

      if (addItems.length !== 0) {
        await db.insert(product_tax).values(
          addItems.map((item: any) => ({
            ProductId: product.id,
            TaxId: item,
          }))
        );
      }

      if (deletedItems.length !== 0) {
        await db
          .delete(product_tax)
          .where(
            and(
              eq(product_tax.ProductId, product.id),
              inArray(product_tax.TaxId, deletedItems)
            )
          );
      }

      return res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, req.params.id),
    });

    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    await db.delete(products).where(eq(products.id, req.params.id));

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

export default router;
