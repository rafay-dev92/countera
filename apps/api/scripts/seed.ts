import "dotenv/config";
import bcrypt from "bcryptjs";
import { UserRole } from "@countera/shared";
import { db, pool, users, permissions, user_permission } from "../db";
import { eq } from "drizzle-orm";

const SUPER_ADMIN_EMAIL = "superadmin@gmail.com";

const permissionNames = [
  "invoice:create",
  "invoice:read",
  "invoice:update",
  "invoice:delete",
  "quote:create",
  "quote:read",
  "quote:update",
  "quote:delete",
  "workorder:create",
  "workorder:read",
  "workorder:update",
  "workorder:delete",
  "appointment:create",
  "appointment:read",
  "appointment:update",
  "appointment:delete",
  "report:read",
  "setting:view",
  "setting:update",
];

async function seed() {
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    throw new Error("SUPER_ADMIN_PASSWORD is not set in .env");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, SUPER_ADMIN_EMAIL),
  });
  if (existing) {
    console.log("Seed skipped: super admin already exists");
    return;
  }

  await db.transaction(async (tx) => {
    const permissionRows = await tx
      .insert(permissions)
      .values(permissionNames.map((name) => ({ name, description: null })))
      .returning();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD!,
      salt
    );

    const [superAdmin] = await tx
      .insert(users)
      .values({
        first_name: "super",
        last_name: "admin",
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        dob: null,
        BusinessId: null,
      })
      .returning();

    await tx.insert(user_permission).values(
      permissionRows.map((perm) => ({
        UserId: superAdmin.id,
        PermissionId: perm.id,
      }))
    );
  });

  console.log(
    `Seed complete: super admin (${SUPER_ADMIN_EMAIL}) with ${permissionNames.length} permissions`
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
