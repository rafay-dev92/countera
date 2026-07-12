export const WorkOrderStatus = {
  PENDING: "PENDING",
  FINISHED: "FINISHED",
} as const;

export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];
