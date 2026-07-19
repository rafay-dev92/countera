import express from "express";
const router = express.Router();
import { db, workorders, workorder_product, products, users, customers, } from "../db";
import { pickColumns, nextDocNumber } from "../db/helpers";
import { eq, and, ne, gte, lte, inArray, isNotNull, ilike, asc, desc, sql, type SQL, } from "drizzle-orm";
import { UserRole, WorkOrderStatus } from "@countera/shared";
import fetchUser from "../middlewares/fetchUser";
import authorizePermission from "../middlewares/authorizePermissions";
import moment from "moment";
import "dotenv/config";

// include trees matching the old Sequelize includes (list routes also pulled
// the product Category; the detail/create/update re-fetch only pulled Tax)
const workOrderListIncludes = {
  Customer: { with: { Address: true, Vehicle: true } },
  CustomerVehicle: true,
  WorkOrderProducts: {
    with: {
      Product: {
        with: { ProductTaxes: { with: { Tax: true } }, Category: true },
      },
    },
  },
  Business: true,
} as const;

const workOrderIncludes = {
  Customer: { with: { Address: true, Vehicle: true } },
  CustomerVehicle: true,
  WorkOrderProducts: {
    with: {
      Product: { with: { ProductTaxes: { with: { Tax: true } } } },
    },
  },
  Business: true,
} as const;

// Sequelize flattened join tables: workorder.Product = [{...product,
// Tax: [{...tax, product_tax}], workorder_product: {...}}]. Remap Drizzle's
// nested rows back to that exact shape.
const formatWorkOrder = (workorder: any) => {
  const { WorkOrderProducts, ...rest } = workorder;
  return {
    ...rest,
    Product: WorkOrderProducts.map(({ Product, ...joinRow }: any) => {
      const { ProductTaxes, ...product } = Product;
      return {
        ...product,
        Tax: ProductTaxes.map(({ Tax, ...productTax }: any) => ({
          ...Tax,
          product_tax: productTax,
        })),
        workorder_product: joinRow,
      };
    }),
  };
};

router.get(
  "/",
  fetchUser,
  authorizePermission("workorder:read"),
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
        // Postgres enums throw on unknown values; MySQL just matched nothing
        const validStatuses = status.filter((s: any) =>
          Object.values(WorkOrderStatus).includes(s)
        ) as WorkOrderStatus[];
        selectedFilters.push(
          validStatuses.length > 0
            ? inArray(workorders.status, validStatuses)
            : sql`false`
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
        selectedFilters.push(inArray(workorders.CustomerId, customerIds));
      } else if (CustomerDetails?.id) {
        const customerId = CustomerDetails.id;
        selectedFilters.push(inArray(workorders.CustomerId, [customerId]));
      }
      else if (CustomerDetails?.name?.trim()) {
        // old code used CustomerId IN (NULL), which matches no rows
        selectedFilters.push(sql`false`);
      }

      if (startDate && endDate) {
        const parsedStartDate = moment.utc(startDate).toDate();
        const parsedEndDate = moment.utc(endDate).toDate();

        if (!isNaN(parsedStartDate.getTime()) && !isNaN(parsedEndDate.getTime())) {
          selectedFilters.push(gte(workorders.createdAt, parsedStartDate));
          selectedFilters.push(lte(workorders.createdAt, parsedEndDate));
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
        eq(workorders.BusinessId, user.BusinessId!)
      );

      const sortOrder =
        order && String(order).toUpperCase() === "ASC"
          ? [asc(workorders.createdAt)]
          : [desc(workorders.createdAt)];
      const parsedIsReport = isReport ? true : false;

      if (parsedIsReport) {
        const rows = await db.query.workorders.findMany({
          where: whereCondition,
          orderBy: sortOrder,
          with: workOrderListIncludes,
        });

        return res.json({
          message: "Work orders fetched successfully (report)",
          data: rows.map(formatWorkOrder),
        });
      }

      const offset = (Number(page) - 1) * Number(limit);

      const count = await db.$count(workorders, whereCondition);
      const rows = await db.query.workorders.findMany({
        where: whereCondition,
        orderBy: sortOrder,
        limit: Number(limit),
        offset: Number(offset),
        with: workOrderListIncludes,
      });

      return res.json({
        message: "Work orders fetched successfully",
        data: rows.map(formatWorkOrder),
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
  authorizePermission("workorder:read"),
  async (req, res) => {
    try {
      const workorder = await db.query.workorders.findFirst({
        where: eq(workorders.id, req.params.id),
        with: workOrderIncludes,
      });

      if (!workorder) {
        return res.status(404).json({ message: "workorder not found" });
      }

      res.json(formatWorkOrder(workorder));
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

      const newWorkOrder = await db.transaction(async (tx) => {
        // the Sequelize beforeCreate hook assigned this; do it explicitly now
        const workOrderNumber = await nextDocNumber(
          tx,
          workorders,
          workorders.workOrderNumber,
          workOrderData.BusinessId
        );
        const [workorder] = await tx
          .insert(workorders)
          .values({ ...pickColumns(workorders, workOrderData), workOrderNumber })
          .returning();

        if (req.body.products && req.body.products.length !== 0) {
          for (const product of req.body.products) {
            const productRecord = await tx.query.products.findFirst({
              where: eq(products.id, product.id),
            });
            if (productRecord) {
              await tx.insert(workorder_product).values({
                WorkOrderId: workorder.id,
                ProductId: productRecord.id,
                quantity: product.quantity,
                description: product.description,
                price: product.price,
              });
            }
          }
        }

        return workorder;
      });

      const currentWorkOrder = await db.query.workorders.findFirst({
        where: eq(workorders.id, newWorkOrder.id),
        with: workOrderIncludes,
      });

      return res.status(200).json({
        message: "WorkOrder created successfully",
        data: formatWorkOrder(currentWorkOrder),
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
      const workorder = await db.query.workorders.findFirst({
        where: eq(workorders.id, req.params.id),
      });

      if (!workorder) {
        return res.status(404).json({ message: "WorkOrder not found" });
      }

      if (req.body?.products && req.body?.products.length > 0) {
        try {
          await db.transaction(async (tx) => {
            await tx
              .delete(workorder_product)
              .where(eq(workorder_product.WorkOrderId, workorder.id));

            for (const product of req.body.products) {
              const productRecord = await tx.query.products.findFirst({
                where: eq(products.id, product.id),
              });
              if (productRecord) {
                await tx.insert(workorder_product).values({
                  WorkOrderId: workorder.id,
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

      const updates = pickColumns(workorders, req.body.workOrderData);
      if (Object.keys(updates).length) {
        await db
          .update(workorders)
          .set(updates)
          .where(eq(workorders.id, workorder.id));
      }

      const currentWorkOrder = await db.query.workorders.findFirst({
        where: eq(workorders.id, workorder.id),
        with: workOrderIncludes,
      });

      return res.status(200).json({
        message: "WorkOrder updated successfully",
        data: formatWorkOrder(currentWorkOrder),
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
      const workorder = await db.query.workorders.findFirst({
        where: eq(workorders.id, req.params.id),
      });

      if (!workorder) {
        return res.status(404).json({ message: "workorder not found" });
      }

      await db.delete(workorders).where(eq(workorders.id, req.params.id));

      res.json({ message: "WorkOrder deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting workorder" });
    }
  }
);

export default router;
