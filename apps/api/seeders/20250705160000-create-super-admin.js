"use strict";

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const UserRole = require("../utils/enums/userRoles");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const permissionNames = [
      "invoice:create",
      "invoice:read",
      "invoice:update",
      "invoice:delete",
      "customer:create",
      "customer:read",
      "customer:update",
      "customer:delete",
      "product:create",
      "product:read",
      "product:update",
      "product:delete",
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
      "setting:view",
      "setting:update",
    ];

    const permissionMap = {};
    const permissions = permissionNames.map((name) => {
      const id = uuidv4();
      permissionMap[name] = id;
      return {
        id,
        name,
        description: null,
        createdAt: now,
        updatedAt: now,
      };
    });

    // Insert permissions
    await queryInterface.bulkInsert("permissions", permissions);

    // Create super admin user
    const superAdminId = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      salt
    );

    await queryInterface.bulkInsert("users", [
      {
        id: superAdminId,
        first_name: "super",
        last_name: "admin",
        email: "superadmin@gmail.com",
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        dob: null,
        BusinessId: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Assign IS_SUPER_ADMIN permission to super admin
    // Assign all permissions to super admin
    const userPermissions = permissionNames.map((perm) => ({
      UserId: superAdminId,
      PermissionId: permissionMap[perm],
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("user_permission", userPermissions);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("user_permission", null, {});
    await queryInterface.bulkDelete("users", { email: "superadmin@gmail.com" });
    await queryInterface.bulkDelete("permissions", null, {});
  },
};
