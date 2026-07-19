import { eq, desc, getTableColumns, Table } from "drizzle-orm";

/**
 * Filter a request body down to real columns of a table, mirroring how
 * Sequelize's create/update silently ignored unknown keys. Also coerces
 * ISO strings to Date for timestamp columns (node-postgres requires Date)
 * and strips id/createdAt/updatedAt so they stay server-controlled.
 *
 * The return type is nominally the table's full insert shape so it plugs
 * into .values()/.set() — at runtime it only contains keys present in
 * `data`, exactly like Sequelize's create/update did.
 */
export function pickColumns<T extends Table>(
  table: T,
  data: Record<string, any> | undefined | null
): T["$inferInsert"] {
  const cols = getTableColumns(table) as Record<string, any>;
  const out: Record<string, any> = {};
  for (const key of Object.keys(data ?? {})) {
    if (!(key in cols)) continue;
    if (key === "id" || key === "createdAt" || key === "updatedAt") continue;
    let value = (data as any)[key];
    if (
      value != null &&
      typeof value === "string" &&
      cols[key].dataType === "date" &&
      cols[key].columnType !== "PgDate"
    ) {
      value = new Date(value);
    }
    out[key] = value;
  }
  return out as T["$inferInsert"];
}

/**
 * Per-business sequential numbering for invoices/quotations/workorders.
 * Ports the Sequelize beforeCreate hooks: latest row for the business
 * (by createdAt) + 1, locked FOR UPDATE to avoid duplicate numbers.
 * Call inside the same transaction as the insert.
 */
export async function nextDocNumber(
  tx: any,
  table: any,
  numberColumn: any,
  businessId: string
): Promise<number> {
  const rows = await tx
    .select({ n: numberColumn })
    .from(table)
    .where(eq(table.BusinessId, businessId))
    .orderBy(desc(table.createdAt))
    .limit(1)
    .for("update");
  return rows.length ? Number(rows[0].n) + 1 : 1;
}
