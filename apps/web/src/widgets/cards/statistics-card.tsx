import type React from "react";

export interface StatisticsCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  footer?: React.ReactNode;
}

export function StatisticsCard({ title, value, hint = null, footer = null }: StatisticsCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
      <p className="text-[13px] font-medium text-slate-600">{title}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {(hint || footer) && (
        <div className="mt-1 text-xs text-slate-500">{hint || footer}</div>
      )}
    </div>
  );
}

StatisticsCard.displayName = "/src/widgets/cards/statistics-card.tsx";

export default StatisticsCard;
