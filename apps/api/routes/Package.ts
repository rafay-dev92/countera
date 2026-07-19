import express from "express";
const router = express.Router();
import { db, packages, package_product, users } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, and, ne, isNotNull, inArray, desc } from "drizzle-orm";
import { UserRole } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import "dotenv/config";

const packageIncludes = {
  PackageProducts: {
    with: {
      Product: {
        with: {
          ProductTaxes: { with: { Tax: true } },
          Category: true,
        },
      },
    },
  },
  Business: true,
} as const;

// flatten the join rows back into the old Sequelize aliases:
// Package.Product = [{...product, Tax: [{...tax, product_tax}], Category, package_product}]
function withProductAlias(pkg: any) {
  const { PackageProducts, ...rest } = pkg;
  return {
    ...rest,
    Product: PackageProducts.map(({ Product, ...package_product }: any) => {
      const { ProductTaxes, ...productRest } = Product;
      return {
        ...productRest,
        Tax: ProductTaxes.map(({ Tax, ...product_tax }: any) => ({
          ...Tax,
          product_tax,
        })),
        package_product,
      };
    }),
  };
}

router.get("/", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        ne(users.role, UserRole.SUPER_ADMIN),
        isNotNull(users.BusinessId)
      ),
    });

    if (user) {
      const packageRows = await db.query.packages.findMany({
        where: eq(packages.BusinessId, user.BusinessId!),
        orderBy: [desc(packages.createdAt)],
        with: packageIncludes,
      });
      return res.json({
        message: "Packages fetched successfully",
        data: packageRows.map(withProductAlias),
      });
    }

    const packageRows = await db.query.packages.findMany({
      orderBy: [desc(packages.createdAt)],
      with: packageIncludes,
    });
    return res.json({
      message: "Packages fetched successfully",
      data: packageRows.map(withProductAlias),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const pkg = await db.query.packages.findFirst({
      where: eq(packages.id, req.params.id),
      with: packageIncludes,
    });

    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    return res.json({
      message: "Package fetched successfully",
      data: withProductAlias(pkg),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", fetchUser, async (req, res) => {
  try {
    const packageData = req.body.packageData;

    const newPackage = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(packages)
        .values(pickColumns(packages, packageData))
        .returning();
      if (req.body.products.length !== 0) {
        await tx.insert(package_product).values(
          req.body.products.map((item: any) => ({
            PackageId: created.id,
            ProductId: item.split(":")[0],
            quantity: item.split(":")[1],
          }))
        );
      }
      return created;
    });

    const currentPackage = await db.query.packages.findFirst({
      where: eq(packages.id, newPackage.id),
      with: packageIncludes,
    });
    return res.status(200).json({
      message: "Package created successfully",
      data: withProductAlias(currentPackage),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    let packageData = req.body.packageData;
    const pkg = await db.query.packages.findFirst({
      where: eq(packages.id, req.params.id),
      with: { PackageProducts: { with: { Product: true } } },
    });

    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    (pkg as any).Product = pkg.PackageProducts.map(({ Product }) => Product);

    if (req.body?.products && req.body?.products.length > 0) {
      try {
        await db.transaction(async (tx) => {
          for (const newProduct of req.body.products) {
            const productId = newProduct.split(":")[0];
            const newQuantity = newProduct.split(":")[1];

            const existingProduct = (pkg as any).Product.find(
              (currentProduct: any) => currentProduct.id === productId
            );

            if (existingProduct) {
              await tx
                .update(package_product)
                .set({ quantity: newQuantity })
                .where(
                  and(
                    eq(package_product.PackageId, pkg.id),
                    eq(package_product.ProductId, productId)
                  )
                );
            } else {
              // If the product doesn't exist, add a new entry to the junction table
              await tx.insert(package_product).values({
                PackageId: pkg.id,
                ProductId: productId,
                quantity: newQuantity,
              });
            }
          }

          const deletedItems = (pkg as any).Product.filter(
            (orgProd: any) =>
              !req.body.products.some(
                (item: any) => item.split(":")[0] === orgProd.id
              )
          ).map((changeItem: any) => changeItem.id);

          if (deletedItems.length !== 0) {
            await tx
              .delete(package_product)
              .where(
                and(
                  eq(package_product.PackageId, pkg.id),
                  inArray(package_product.ProductId, deletedItems)
                )
              );
          }
        });
      } catch (error) {
        return res.status(500).json({ message: "Internel Server Error" });
      }
    }

    const updates = pickColumns(packages, packageData);
    if (Object.keys(updates).length) {
      await db.update(packages).set(updates).where(eq(packages.id, pkg.id));
    }

    const currentPackage = await db.query.packages.findFirst({
      where: eq(packages.id, pkg.id),
      with: packageIncludes,
    });

    return res.status(200).json({
      message: "Package updated successfully",
      data: withProductAlias(currentPackage),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const pkg = await db.query.packages.findFirst({
      where: eq(packages.id, req.params.id),
    });

    if (!pkg) {
      return res.status(404).json({ message: "package not found" });
    }

    await db.delete(packages).where(eq(packages.id, req.params.id));

    return res.status(200).json({ message: "package deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting package" });
  }
});

export default router;
