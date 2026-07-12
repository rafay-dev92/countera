export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  SALESMAN: "SALESMAN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const userRolesForSelect = [
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.USER, label: "User" },
  { value: UserRole.MANAGER, label: "Manager" },
  { value: UserRole.CASHIER, label: "Cashier" },
  { value: UserRole.SALESMAN, label: "Salesman" },
];
