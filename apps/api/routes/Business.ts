import express from "express";
const router = express.Router();
import { db, businesses, taxes, products, product_categories, product_tax, packages, package_product, invoices, quotations, workorders, customers, } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, or } from "drizzle-orm";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";
import multer from "multer";
import getDefaultPackages from "../data/default-packages";
import getDefaultProducts from "../data/default-products";
import defaultTandCs from "../data/defaultT&Cs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/business/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", fetchUser, async (req, res) => {
  try {
    const business = await db.query.businesses.findMany({
      with: { User: true },
    });
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, req.params.id),
      with: { User: true, Customer: true },
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json({ message: "business fetched", data: business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// the middleware is runtime-identical, so bridge the type mismatch with a cast.
router.post("/create", upload.single("logo"), async (req, res) => {
  try {
    const businessData = req.body;

    const { name, email, licenseNumber, permitNumber } = businessData;
    const existingBusiness = await db.query.businesses.findFirst({
      where: or(
        eq(businesses.licenseNumber, licenseNumber),
        eq(businesses.permitNumber, permitNumber)
      ),
    });

    if (existingBusiness) {
      return res.status(409).json({ message: "Business already exists with this license or permit number" });
    }

    if (req.file) {
      const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/business/${req.file.filename}`;
      businessData.logo = imageUrl;
    }

    businessData.termsAndConditions = defaultTandCs();

    const newBusiness = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(businesses)
        .values(pickColumns(businesses, businessData))
        .returning();

      const defaultTaxes = await tx
        .insert(taxes)
        .values([
          {
            name: "Sales Tax",
            type: "%",
            rate: 9.75,
            default: false,
            BusinessId: created.id,
          },
          {
            name: "CA Tire Tax",
            type: "$",
            rate: 1.75,
            default: false,
            BusinessId: created.id,
          },
          {
            name: "RECYCLE TIRES",
            type: "$",
            rate: 5,
            default: false,
            BusinessId: created.id,
          },
        ])
        .returning();

      const defaultCategories = await tx
        .insert(product_categories)
        .values([
          {
            name: "Recycle Items",
            description: "Recycle Items",
            BusinessId: created.id,
          },
          {
            name: "Labor",
            description: "All kind of Labor Category",
            BusinessId: created.id,
          },
          {
            name: "Wheels",
            description: "All kind of Wheels Category",
            BusinessId: created.id,
          },
          {
            name: "Auto Part",
            description: "All Auto Part Should be in this category",
            BusinessId: created.id,
          },
          { name: "Used Tire", description: "", BusinessId: created.id },
          { name: "New Tire", description: "", BusinessId: created.id },
        ])
        .returning();

      // 3. Create Default Products
      const taxMap: Record<string, string> = {};
      for (const tax of defaultTaxes) {
        taxMap[tax.name] = tax.id;
      }

      const categoryMap: Record<string, string> = {};
      for (const cat of defaultCategories) {
        categoryMap[cat.name] = cat.id;
      }

      const productMap: Record<string, typeof products.$inferSelect> = {};
      const productTemplates = getDefaultProducts();

      for (const template of productTemplates) {
        const productData = {
          name: template.name,
          cost: template.cost,
          margin: template.margin,
          price: template.price,
          itemCode: template.itemCode,
          type: template.type,
          description: template.description,
          taxable: template.taxable,
          CategoryId: categoryMap[template.categoryName],
          BusinessId: created.id,
        };

        const [newProduct] = await tx
          .insert(products)
          .values(productData)
          .returning();
        productMap[template.name] = newProduct;

        if (template.taxable && template.taxNames?.length) {
          const taxIds = template.taxNames
            .map((name) => taxMap[name])
            .filter(Boolean);

          if (taxIds.length) {
            await tx.insert(product_tax).values(
              taxIds.map((TaxId) => ({
                ProductId: newProduct.id,
                TaxId,
              }))
            );
          }
        }
      }

      // 4. Create Default Packages
      const productPackageTemplates = getDefaultPackages();

      for (const template of productPackageTemplates) {
        const packageData = {
          name: template.name,
          description: template.description,
          price: (template as any).price,
          BusinessId: created.id,
        };

        const [newPackage] = await tx
          .insert(packages)
          .values(pickColumns(packages, packageData))
          .returning();

        if (template.products?.length) {
          const packageProductRows = template.products
            .map((entry) => {
              const [productName, quantityStr] = entry.split(":");
              const product = productMap[productName];
              const quantity = parseInt(quantityStr, 10);

              if (!product || isNaN(quantity)) return null;

              return {
                PackageId: newPackage.id,
                ProductId: product.id,
                quantity,
              };
            })
            .filter((row) => row !== null);

          if (packageProductRows.length) {
            await tx.insert(package_product).values(packageProductRows);
          }
        }
      }

      return created;
    });

    res.json(newBusiness);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", upload.single("logo"), async (req, res) => {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, req.params.id),
    });

    if (!business) {
      return res.status(404).json({ message: "business not found" });
    }
    if (req.file) {
      const imageUrl = `${process.env.STATIC_FILE_BASE_URL}/business/${req.file.filename}`;
      req.body.logo = imageUrl;
    }
    const updates = pickColumns(businesses, req.body);
    if (Object.keys(updates).length) {
      await db
        .update(businesses)
        .set(updates)
        .where(eq(businesses.id, req.params.id));
    }

    res.json({
      message: "Business updated successfully",
      data: await db.query.businesses.findFirst({
        where: eq(businesses.id, req.params.id),
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, req.params.id),
    });

    if (!business) {
      return res.status(404).json({ message: "business not found" });
    }

    await db.transaction(async (tx) => {
      // Delete associated products, packages, and taxes
      await tx.delete(invoices).where(eq(invoices.BusinessId, business.id));
      await tx.delete(quotations).where(eq(quotations.BusinessId, business.id));
      await tx.delete(workorders).where(eq(workorders.BusinessId, business.id));
      await tx.delete(customers).where(eq(customers.BusinessId, business.id));
      await tx.delete(products).where(eq(products.BusinessId, business.id));
      await tx.delete(packages).where(eq(packages.BusinessId, business.id));
      await tx.delete(taxes).where(eq(taxes.BusinessId, business.id));
      await tx.delete(businesses).where(eq(businesses.id, business.id));
    });

    res.json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting business" });
  }
});

export default router;
