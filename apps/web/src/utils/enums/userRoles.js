export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  SALESMAN: 'SALESMAN',
};

export const userRolesForSelect = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.USER, label: 'User' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.CASHIER, label: 'Cashier' },
  { value: UserRole.SALESMAN, label: 'Salesman' },
];