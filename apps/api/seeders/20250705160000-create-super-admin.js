'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const permissionNames = [
      'IS_SUPER_ADMIN',
      'IS_ADMIN',
      'IS_MANAGER',
      'IS_USER',
      'IS_VIEWER',
      'IS_SALESMAN',
      'IS_CASHIER',
      'CAN_DELETE',
      'CAN_ADD',
      'CAN_UPDATE'
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
        updatedAt: now
      };
    });

    // Insert permissions
    await queryInterface.bulkInsert('permissions', permissions);

    // Create super admin user
    const superAdminId = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, salt);

    await queryInterface.bulkInsert('users', [{
      id: superAdminId,
      first_name: 'super',
      last_name: 'admin',
      email: 'superadmin@gmail.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      dob: null,
      BusinessId: null,
      createdAt: now,
      updatedAt: now
    }]);

    // Assign IS_SUPER_ADMIN permission to super admin
    await queryInterface.bulkInsert('user_permission', [
      {
        UserId: superAdminId,
        PermissionId: permissionMap['IS_SUPER_ADMIN'],
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_permission', null, {});
    await queryInterface.bulkDelete('users', { email: 'superadmin@gmail.com' });
    await queryInterface.bulkDelete('permissions', null, {});

  }
};
