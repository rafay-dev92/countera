import express from "express";
const router = express.Router();
import { db, users, permissions, user_permission } from "../db";
import { pickColumns } from "../db/helpers";
import { eq, and, ne, isNull, isNotNull, asc } from "drizzle-orm";
import { body, validationResult } from "express-validator";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import fetchUser from "../middlewares/fetchUser";
import { UserRole } from "@countera/shared";
import type { Request, Response } from "express";
import "dotenv/config";

// Sequelize flattened the user_permission join under the "Permission" alias;
// remap Drizzle's nested UserPermissions rows back to that shape.
const formatUser = (user: any) => {
  if (!user) return user;
  const { UserPermissions, ...rest } = user;
  return {
    ...rest,
    Permission: (UserPermissions || []).map(({ Permission, ...joinRow }: any) => ({
      ...Permission,
      user_permission: joinRow,
    })),
  };
};

router.get("/", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const loggedInUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        ne(users.role, UserRole.SUPER_ADMIN),
        isNotNull(users.BusinessId)
      ),
    });

    if (loggedInUser) {
      const user = await db.query.users.findMany({
        where: eq(users.BusinessId, loggedInUser.BusinessId!),
        with: {
          UserPermissions: { with: { Permission: true } },
          Business: true,
        },
      });
      return res.json(user.map(formatUser));
    }
    const user = await db.query.users.findMany({
      with: {
        UserPermissions: { with: { Permission: true } },
        Business: true,
      },
      orderBy: [asc(users.createdAt)],
    });
    // Relational queries can't order by a joined column; Sequelize ordered by
    // Business.name ASC (nulls first) then createdAt ASC, so sort in memory.
    user.sort((a, b) => {
      const nameA = a.Business?.name ?? "";
      const nameB = b.Business?.name ?? "";
      if (nameA !== nameB) return nameA < nameB ? -1 : 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    return res.json(user.map(formatUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", fetchUser, async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.params.id),
      with: { UserPermissions: { with: { Permission: true } } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/signup",
  [
    body("user.email", "Enter a valid email").isEmail(),
    body(
      "user.password",
      "Password must be atleast 5 characters long"
    ).isLength({ min: 5 }),
  ],
  fetchUser,
  async (req: Request, res: Response) => {
    //Checking whether request is normal
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res
        .status(400)
        .json({ message: `User not created. ${(errors as any).errors[0]?.msg}` });

    try {
      const userData = req.body.user;

      if (userData.role !== UserRole.SUPER_ADMIN && !userData.BusinessId) {
        return res.status(400).json({ message: "BusinessId is required" });
      }

      if (req.body.permissions && req.body.permissions.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one permission is required" });
      }

      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.email, userData.email),
          userData.BusinessId == null
            ? isNull(users.BusinessId)
            : eq(users.BusinessId, userData.BusinessId)
        ),
      });

      if (existingUser) {
        res.status(409).json({ message: "User already exist" });
      } else {
        const salt = await bcryptjs.genSalt(10);
        const secPass = await bcryptjs.hash(userData.password, salt);

        await db.transaction(async (tx) => {
          const [newUser] = await tx
            .insert(users)
            .values(pickColumns(users, { ...userData, password: secPass }))
            .returning();

          // setPermission([...]) equivalent: replace the user's join rows
          await tx
            .delete(user_permission)
            .where(eq(user_permission.UserId, newUser.id));
          if (req.body.permissions && req.body.permissions.length !== 0) {
            await tx.insert(user_permission).values(
              req.body.permissions.map((permissionId: any) => ({
                UserId: newUser.id,
                PermissionId: permissionId,
              }))
            );
          }
        });

        res.status(200).json({ message: "User created successfully" });
      }
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        return res.status(409).json({ message: "User already exist" });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

router.post("/add_permission", async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.body.userId),
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.body.permission.length !== 0) {
      await Promise.all(
        req.body.permissions.map(async (item: any) => {
          const permission = await db.query.permissions.findFirst({
            where: eq(permissions.id, item),
          });
          await db
            .insert(user_permission)
            .values({ UserId: user.id, PermissionId: permission!.id })
            .onConflictDoNothing();
        })
      );
    }

    res.json({ message: "permissions added to user successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, businessId } = req.body;
    const whereClause = [eq(users.email, email)];
    if (businessId) whereClause.push(eq(users.BusinessId, businessId));

    const user = await db.query.users.findFirst({
      where: and(...whereClause),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passMatch = await bcryptjs.compare(password, user.password);

    if (!passMatch) {
      return res
        .status(401)
        .json({ message: "Please provide correct credentials" });
    }

    const data = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(data, process.env.JWT_SECRET!, {
      expiresIn: 0.5 * 60 * 60,
    });

    const refreshToken = jwt.sign(data, process.env.JWT_SECRET!, {
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });

    res.send({
      token: token,
      refreshToken: refreshToken,
      sessionExpire: Date.now() + 0.5 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error login user" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.header("refresh-token");
    const token = req.header("auth-token");

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    if (!token) {
      return res.status(401).json({ message: "Auth token is required" });
    }

    // Verify refresh token
    let refreshTokenData;
    try {
      refreshTokenData = jwt.verify(refreshToken, process.env.JWT_SECRET!) as {
        user: { id: string };
      };
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Optionally verify the old token (it might be expired, which is fine)
    let oldTokenData;
    try {
      oldTokenData = jwt.verify(token, process.env.JWT_SECRET!) as {
        user: { id: string };
      };
      if (oldTokenData.user.id !== refreshTokenData.user.id) {
        return res.status(401).json({ message: "Token mismatch" });
      }
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Generate new access token
    const data = {
      user: {
        id: refreshTokenData.user.id,
      },
    };

    const newToken = jwt.sign(data, process.env.JWT_SECRET!, {
      expiresIn: 0.5 * 60 * 60,
    });

    res.send({
      token: newToken,
      refreshToken: refreshToken,
      sessionExpire: Date.now() + 0.5 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error refreshing token" });
  }
});

router.post("/businesses-for-email", async (req, res) => {
  try {
    const { email, captcha } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!captcha) {
      return res.status(400).json({ success: false, message: "Captcha is required" });
    }

    // Verify captcha
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`;
    const response = await fetch(verifyUrl, { method: "POST" });
    const captchaData = (await response.json()) as any;

    if (!captchaData.success) {
      return res.status(400).json({
        success: false,
        message: "Captcha verification failed",
      });
    }

    const userRows = await db.query.users.findMany({
      where: eq(users.email, email),
      with: {
        Business: { columns: { id: true, name: true } },
      },
    });

    if (userRows.length > 0 && userRows[0].role === UserRole.SUPER_ADMIN) {
      return res.json({ isSuperAdmin: true });
    }

    const businesses = userRows.map((user) => user.Business).filter(Boolean);
    res.json({ businesses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching businesses for email" });
  }
});

router.post("/getuser", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { password: false },
      with: {
        UserPermissions: { with: { Permission: true } },
        Business: true,
      },
    });

    res.send(formatUser(user));
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update/:id", fetchUser, async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.params.id),
      with: { UserPermissions: { with: { Permission: true } } },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.user.password) {
      const salt = await bcryptjs.genSalt(10);
      const secPass = await bcryptjs.hash(req.body.user.password, salt);
      req.body.user.password = secPass;
    } else {
      req.body.user.password = user.password;
    }
    const updates = pickColumns(users, req.body.user);
    if (Object.keys(updates).length) {
      await db.update(users).set(updates).where(eq(users.id, user.id));
    }

    const currentPermissions = user.UserPermissions.map((up) => up.Permission);

    const deletedItems = currentPermissions
      .filter(
        (orgPerm) => !req.body.permissions.some((item: any) => item === orgPerm.id)
      )
      .map((changeItem) => changeItem.id);

    const addItems = req.body.permissions.filter(
      (perm: any) => !currentPermissions.some((item) => item.id === perm)
    );

    if (addItems.length !== 0) {
      await Promise.all(
        addItems.map(async (item: any) => {
          const permission = await db.query.permissions.findFirst({
            where: eq(permissions.id, item),
          });
          await db
            .insert(user_permission)
            .values({ UserId: user.id, PermissionId: permission!.id })
            .onConflictDoNothing();
        })
      );
    }

    if (deletedItems.length !== 0) {
      await Promise.all(
        deletedItems.map(async (item) => {
          await db
            .delete(user_permission)
            .where(
              and(
                eq(user_permission.UserId, user.id),
                eq(user_permission.PermissionId, item)
              )
            );
        })
      );
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
});

router.delete("/delete/:id", fetchUser, async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.params.id),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.delete(users).where(eq(users.id, req.params.id));
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

router.delete("/delete_permission", async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.body.userId),
    });
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, req.body.permissionId),
    });

    await db
      .delete(user_permission)
      .where(
        and(
          eq(user_permission.UserId, user!.id),
          eq(user_permission.PermissionId, permission!.id)
        )
      );
    res.json({ message: "permission removed from user successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing permission from user" });
  }
});

export default router;
