import { db, invoice_audits, products as productsTable } from "../db";
import { eq } from "drizzle-orm";

type ChangeType =
  | "UPDATE"
  | "ADD"
  | "REMOVE"
  | "UPDATE_ADD"
  | "UPDATE_REMOVE"
  | "ADD_REMOVE"
  | "MULTIPLE";

type AuditChange = {
  fieldName: string;
  oldValue: any;
  newValue: any;
  type: ChangeType;
};

// Helper function to safely stringify values
const safeStringify = (value: any) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

// Helper function to compare values
const hasValueChanged = (oldValue: any, newValue: any) => {
  if (newValue === undefined) return false;
  if (oldValue === newValue) return false;

  if (typeof oldValue === "object" && typeof newValue === "object") {
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }

  return String(oldValue) !== String(newValue);
};

// Helper function to determine change type
const determineChangeType = (oldValue: any, newValue: any): ChangeType => {
  if (oldValue === undefined && newValue !== undefined) return "ADD";
  if (oldValue !== undefined && newValue === undefined) return "REMOVE";
  return "UPDATE";
};

// Track changes for a single field
const trackFieldChange = async (
  invoiceId: string,
  userId: string,
  fieldName: string,
  oldValue: any,
  newValue: any,
  changeType: ChangeType | null = null
) => {
  if (hasValueChanged(oldValue, newValue)) {
    const actualChangeType =
      changeType || determineChangeType(oldValue, newValue);
    await db.insert(invoice_audits).values({
      invoiceId,
      userId,
      fieldName,
      oldValue: safeStringify(oldValue),
      newValue: safeStringify(newValue),
      changeType: actualChangeType,
    });
  }
};

// Track changes for an object (like invoice data)
const trackObjectChanges = async (
  invoiceId: string,
  userId: string,
  oldObject: any,
  newObject: any,
  products: any[],
  prefix = ""
) => {
  const fieldsToTrack = Object.keys(oldObject || {});
  const changes: AuditChange[] = [];

  for (const field of fieldsToTrack) {
    if (
      [
        "createdAt",
        "updatedAt",
        "Customer",
        "Payments",
        "CustomerVehicle",
        "Vehicle",
        "Business",
        "paymentStatus",
      ].includes(field)
    )
      continue;

    const fieldName = prefix ? `${prefix}_${field}` : field;
    const oldValue = oldObject?.[field];
    const newValue = newObject?.[field];

    // Special handling for products
    if (field === "products" || field === "Products") {
      const oldProducts = Array.isArray(oldValue) ? oldValue : [];
      const newProducts = Array.isArray(newValue) ? newValue : [];

      // Track removed products
      for (const oldProduct of oldProducts) {
        if (!products.some((p) => p.id === oldProduct.id)) {
          changes.push({
            fieldName: `product_${oldProduct.name}`,
            oldValue: oldProduct,
            newValue: null,
            type: "REMOVE",
          });
        }
      }

      // Track added and updated products
      for (const newProduct of products) {
        const oldProduct = oldProducts.find((p) => p.id === newProduct.id);

        if (!oldProduct) {
          const product = await db.query.products.findFirst({
            where: eq(productsTable.id, newProduct.id),
          });
          changes.push({
            fieldName: `product_${product!.name}`,
            oldValue: null,
            newValue: newProduct,
            type: "ADD",
          });
        } else {
          const oldInvoiceProduct = oldProduct.invoice_product;
          const newInvoiceProduct = products.find(
            (prod) => prod.id === oldInvoiceProduct.ProductId
          );

          if (oldInvoiceProduct && newInvoiceProduct) {
            if (
              hasValueChanged(oldInvoiceProduct.price, newInvoiceProduct.price)
            ) {
              changes.push({
                fieldName: `product_${oldProduct.name}_price`,
                oldValue: { price: oldInvoiceProduct.price },
                newValue: { price: newInvoiceProduct.price },
                type: "UPDATE",
              });
            }

            if (
              hasValueChanged(
                oldInvoiceProduct.quantity,
                newInvoiceProduct.quantity
              )
            ) {
              changes.push({
                fieldName: `product_${oldProduct.name}_quantity`,
                oldValue: { quantity: oldInvoiceProduct.quantity },
                newValue: { quantity: newInvoiceProduct.quantity },
                type: "UPDATE",
              });
            }

            if (
              hasValueChanged(
                oldInvoiceProduct.description,
                newInvoiceProduct.description
              )
            ) {
              changes.push({
                fieldName: `product_${oldProduct.name}_description`,
                oldValue: { description: oldInvoiceProduct.description },
                newValue: { description: newInvoiceProduct.description },
                type: "UPDATE",
              });
            }
          }
        }
      }
      continue;
    }

    if (hasValueChanged(oldValue, newValue)) {
      changes.push({
        fieldName,
        oldValue,
        newValue,
        type: determineChangeType(oldValue, newValue),
      });
    }
  }

  if (changes.length > 1) {
    const changeTypes = new Set(changes.map((c) => c.type));
    let combinedType: ChangeType = "MULTIPLE";

    if (changeTypes.size === 2) {
      if (changeTypes.has("UPDATE") && changeTypes.has("ADD")) {
        combinedType = "UPDATE_ADD";
      } else if (changeTypes.has("UPDATE") && changeTypes.has("REMOVE")) {
        combinedType = "UPDATE_REMOVE";
      } else if (changeTypes.has("ADD") && changeTypes.has("REMOVE")) {
        combinedType = "ADD_REMOVE";
      }
    }

    // Create a single object with all changes
    const oldValueObj: Record<string, any> = {};
    const newValueObj: Record<string, any> = {};

    changes.forEach((change) => {
      oldValueObj[change.fieldName] = change.oldValue;
      newValueObj[change.fieldName] = change.newValue;
    });

    await db.insert(invoice_audits).values({
      invoiceId,
      userId,
      fieldName: prefix || "multiple_fields",
      oldValue: JSON.stringify(oldValueObj),
      newValue: JSON.stringify(newValueObj),
      changeType: combinedType,
    });
  } else if (changes.length === 1) {
    const change = changes[0];
    // For single changes, create an object with a single field
    const oldValueObj = { [change.fieldName]: change.oldValue };
    const newValueObj = { [change.fieldName]: change.newValue };

    await db.insert(invoice_audits).values({
      invoiceId,
      userId,
      fieldName: change.fieldName,
      oldValue: JSON.stringify(oldValueObj),
      newValue: JSON.stringify(newValueObj),
      changeType: change.type,
    });
  }
};

// Track changes for products
const trackProductChanges = async (
  invoiceId: string,
  userId: string,
  oldProducts: any[],
  newProducts: any[]
) => {
  const oldProductMap = new Map(oldProducts.map((p) => [p.id, p]));
  const newProductMap = new Map(newProducts.map((p) => [p.id, p]));
  const changes: AuditChange[] = [];

  // Track removed products
  for (const [productId, oldProduct] of oldProductMap) {
    if (!newProductMap.has(productId)) {
      changes.push({
        fieldName: `product_${productId}`,
        oldValue: { id: oldProduct.id, name: oldProduct.name },
        newValue: null,
        type: "REMOVE",
      });
    }
  }

  // Track added and updated products
  for (const [productId, newProduct] of newProductMap) {
    const oldProduct = oldProductMap.get(productId);

    if (!oldProduct) {
      const product = await db.query.products.findFirst({
        where: eq(productsTable.id, newProduct.id),
      });
      changes.push({
        fieldName: `product_${product!.name}`,
        oldValue: null,
        newValue: newProduct,
        type: "ADD",
      });
    } else {
      const fieldsToTrack = ["quantity", "price", "description"];

      for (const field of fieldsToTrack) {
        const oldValue =
          typeof oldProduct[field] === "object" && oldProduct[field] !== null
            ? oldProduct[field][field]
            : oldProduct[field];
        const newValue =
          typeof newProduct[field] === "object" && newProduct[field] !== null
            ? newProduct[field][field]
            : newProduct[field];
        if (hasValueChanged(oldValue, newValue)) {
          changes.push({
            fieldName: `product_${productId}_${field}`,
            oldValue: { [field]: oldValue },
            newValue: { [field]: newValue },
            type: "UPDATE",
          });
        }
      }
    }
  }

  if (changes.length > 1) {
    const changeTypes = new Set(changes.map((c) => c.type));
    let combinedType: ChangeType = "MULTIPLE";

    if (changeTypes.size === 2) {
      if (changeTypes.has("UPDATE") && changeTypes.has("ADD")) {
        combinedType = "UPDATE_ADD";
      } else if (changeTypes.has("UPDATE") && changeTypes.has("REMOVE")) {
        combinedType = "UPDATE_REMOVE";
      } else if (changeTypes.has("ADD") && changeTypes.has("REMOVE")) {
        combinedType = "ADD_REMOVE";
      }
    }

    await db.insert(invoice_audits).values({
      invoiceId,
      userId,
      fieldName: "products",
      oldValue: JSON.stringify(
        changes.map((c) => ({ field: c.fieldName, value: c.oldValue }))
      ),
      newValue: JSON.stringify(
        changes.map((c) => ({ field: c.fieldName, value: c.newValue }))
      ),
      changeType: combinedType,
    });
  } else if (changes.length === 1) {
    const change = changes[0];
    await trackFieldChange(
      invoiceId,
      userId,
      change.fieldName,
      change.oldValue,
      change.newValue,
      change.type
    );
  }
};

export { trackObjectChanges, trackProductChanges, trackFieldChange, };
