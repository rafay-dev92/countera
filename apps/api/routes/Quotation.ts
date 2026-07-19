import express from "express";
const router = express.Router();
import { db, quotations, quotation_product, products, users, customers, } from "../db";
import { pickColumns, nextDocNumber } from "../db/helpers";
import { eq, and, ne, gte, lte, inArray, isNotNull, ilike, asc, desc, sql, type SQL, } from "drizzle-orm";
import { UserRole } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import authorizePermission from "../middlewares/authorizePermissions";
import moment from "moment";
import "dotenv/config";

// include trees matching the old Sequelize includes (list routes also pulled
// the product Category; the detail/create/update re-fetch only pulled Tax)
const quotationListIncludes = {
  Customer: { with: { Address: true, Vehicle: true } },
  CustomerVehicle: true,
  QuotationProducts: {
    with: {
      Product: {
        with: { ProductTaxes: { with: { Tax: true } }, Category: true },
      },
    },
  },
  Business: true,
} as const;

const quotationIncludes = {
  Customer: { with: { Address: true, Vehicle: true } },
  CustomerVehicle: true,
  QuotationProducts: {
    with: {
      Product: { with: { ProductTaxes: { with: { Tax: true } } } },
    },
  },
  Business: true,
} as const;

// Sequelize flattened join tables: quotation.Product = [{...product,
// Tax: [{...tax, product_tax}], quotation_product: {...}}]. Remap Drizzle's
// nested rows back to that exact shape.
const formatQuotation = (quotation: any) => {
  const { QuotationProducts, ...rest } = quotation;
  return {
    ...rest,
    Product: QuotationProducts.map(({ Product, ...joinRow }: any) => {
      const { ProductTaxes, ...product } = Product;
      return {
        ...product,
        Tax: ProductTaxes.map(({ Tax, ...productTax }: any) => ({
          ...Tax,
          product_tax: productTax,
        })),
        quotation_product: joinRow,
      };
    }),
  };
};

router.get(
  "/",
  fetchUser,
  authorizePermission("quote:read"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, filters } = req.query;

      const parsedFilters = JSON.parse((filters as string) || '{}');
      const {
        CustomerDetails,
        status,
        startDate,
        endDate,
        isReport,
        order,
      } = parsedFilters;
      const selectedFilters: SQL[] = [];

      if (Array.isArray(status) && status.length > 0) {
        selectedFilters.push(
          inArray(quotations.approved, status.map((s: any) => s === 'APPROVED'))
        );
      }

      let matchingCustomers = null;
      if (
        (CustomerDetails?.name &&
          typeof CustomerDetails?.name === "string" &&
          CustomerDetails?.name?.trim() !== "") ||
        CustomerDetails?.id
      ) {
        matchingCustomers = await db
          .select({ id: customers.id })
          .from(customers)
          .where(
            ilike(
              sql`(${customers.firstName} || ' ' || ${customers.lastName})`,
              `%${CustomerDetails?.name?.trim()}%`
            )
          );
      }

      if (matchingCustomers && matchingCustomers.length > 0) {
        const customerIds = matchingCustomers.map((customer) => customer.id);
        selectedFilters.push(inArray(quotations.CustomerId, customerIds));
      } else if (CustomerDetails?.id) {
        const customerId = CustomerDetails.id;
        selectedFilters.push(inArray(quotations.CustomerId, [customerId]));
      }
      else if (CustomerDetails?.name?.trim()) {
        // old code used CustomerId IN (NULL), which matches no rows
        selectedFilters.push(sql`false`);
      }

      if (startDate && endDate) {
        const parsedStartDate = moment.utc(startDate).toDate();
        const parsedEndDate = moment.utc(endDate).toDate();

        if (!isNaN(parsedStartDate.getTime()) && !isNaN(parsedEndDate.getTime())) {
          selectedFilters.push(gte(quotations.createdAt, parsedStartDate));
          selectedFilters.push(lte(quotations.createdAt, parsedEndDate));
        }
      }

      const userId = req.user.id;
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          ne(users.role, UserRole.SUPER_ADMIN),
          isNotNull(users.BusinessId)
        ),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found", data: [] });
      }

      const whereCondition = and(
        ...selectedFilters,
        eq(quotations.BusinessId, user.BusinessId!)
      );

      const sortOrder =
        order && String(order).toUpperCase() === "ASC"
          ? [asc(quotations.createdAt)]
          : [desc(quotations.createdAt)];
      const parsedIsReport = isReport ? true : false;

      if (parsedIsReport) {
        const rows = await db.query.quotations.findMany({
          where: whereCondition,
          orderBy: sortOrder,
          with: quotationListIncludes,
        });

        return res.json({
          message: "Quotations fetched successfully (report)",
          data: rows.map(formatQuotation),
        });
      }

      const offset = (Number(page) - 1) * Number(limit);

      const count = await db.$count(quotations, whereCondition);
      const rows = await db.query.quotations.findMany({
        where: whereCondition,
        orderBy: sortOrder,
        limit: Number(limit),
        offset: Number(offset),
        with: quotationListIncludes,
      });

      return res.json({
        message: "Quotations fetched successfully",
        data: rows.map(formatQuotation),
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
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
      const quotataion = await db.query.quotations.findFirst({
        where: eq(quotations.id, req.params.id),
        with: quotationIncludes,
      });

      if (!quotataion) {
        return res.status(404).json({ message: "quotataion not found" });
      }

      res.json(formatQuotation(quotataion));
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

      const newQuotation = await db.transaction(async (tx) => {
        // the Sequelize beforeCreate hook assigned this; do it explicitly now
        const quotationNumber = await nextDocNumber(
          tx,
          quotations,
          quotations.quotationNumber,
          quotationData.BusinessId
        );
        const [quotation] = await tx
          .insert(quotations)
          .values({ ...pickColumns(quotations, quotationData), quotationNumber })
          .returning();

        if (req.body.products && req.body.products.length !== 0) {
          for (const product of req.body.products) {
            const productRecord = await tx.query.products.findFirst({
              where: eq(products.id, product.id),
            });
            if (productRecord) {
              await tx.insert(quotation_product).values({
                QuotationId: quotation.id,
                ProductId: productRecord.id,
                quantity: product.quantity,
                description: product.description,
                price: product.price,
              });
            }
          }
        }

        return quotation;
      });

      const currentQuotation = await db.query.quotations.findFirst({
        where: eq(quotations.id, newQuotation.id),
        with: quotationIncludes,
      });

      return res.status(200).json({
        message: "Quotation created successfully",
        data: formatQuotation(currentQuotation),
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
      const quotation = await db.query.quotations.findFirst({
        where: eq(quotations.id, req.params.id),
      });

      if (!quotation) {
        return res.status(404).json({ message: "Quotataion not found" });
      }

      if (req.body?.products && req.body?.products.length > 0) {
        try {
          await db.transaction(async (tx) => {
            await tx
              .delete(quotation_product)
              .where(eq(quotation_product.QuotationId, quotation.id));

            for (const product of req.body.products) {
              const productRecord = await tx.query.products.findFirst({
                where: eq(products.id, product.id),
              });
              if (productRecord) {
                await tx.insert(quotation_product).values({
                  QuotationId: quotation.id,
                  ProductId: productRecord.id,
                  quantity: product.quantity,
                  description: product.description,
                  price: product.price,
                });
              }
            }
          });
        } catch (error) {
          return res.status(500).json({ message: "Internel Server Error" });
        }
      }

      const updates = pickColumns(quotations, req.body.quotationData);
      if (Object.keys(updates).length) {
        await db
          .update(quotations)
          .set(updates)
          .where(eq(quotations.id, quotation.id));
      }

      const currentQuotation = await db.query.quotations.findFirst({
        where: eq(quotations.id, quotation.id),
        with: quotationIncludes,
      });

      return res.status(200).json({
        message: "Quotation updated successfully",
        data: formatQuotation(currentQuotation),
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
      const quotataion = await db.query.quotations.findFirst({
        where: eq(quotations.id, req.params.id),
      });

      if (!quotataion) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      await db.delete(quotations).where(eq(quotations.id, req.params.id));

      return res
        .status(200)
        .json({ message: "Quotation deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting quotataion" });
    }
  }
);

export default router;
