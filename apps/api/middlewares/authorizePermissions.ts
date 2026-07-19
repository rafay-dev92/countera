import { db, users } from "../db";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { UserRole } from "@countera/shared";

function authorizePermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // assumed to be set by your auth middleware
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { id: true, role: true },
      with: { UserPermissions: { with: { Permission: true } } },
    });

    if (!userData) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userData.role === UserRole.SUPER_ADMIN) {
      return next(); // Super admin has all permissions
    }

    const hasPermission = userData.UserPermissions.some(
      (up) => up.Permission.name === requiredPermission
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permission" });
    }

    next();
  };
}

export default authorizePermission;
