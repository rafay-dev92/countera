import React from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import type { Reminder } from '@/types/api';

export interface RemindersListProps {
  title: React.ReactNode;
  reminders?: Reminder[];
}

export function RemindersList({ title, reminders = [] }: RemindersListProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
          {reminders?.length ?? 0}
        </span>
      </div>

      {!reminders || reminders.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <BellAlertIcon className="mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No reminders today</p>
          <p className="mt-1 text-[13px] text-slate-500">
            No replacement reminders are due today.
          </p>
        </div>
      ) : (
        <div className="max-h-72 flex-1 divide-y divide-slate-100 overflow-y-auto">
          {reminders.map((reminder, index) => (
            <div key={index} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[13.5px] font-medium text-slate-900">
                    {reminder.Invoice?.Customer?.firstName} {reminder.Invoice?.Customer?.lastName}
                  </p>
                  <p className="shrink-0 text-xs tabular-nums text-slate-500">
                    Invoice #{reminder.Invoice?.invoiceNumber || reminder.Invoice?.id?.slice(-8)}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-slate-600">
                  {reminder.Product?.name}
                </p>
                <p className="mt-0.5 text-xs font-medium text-amber-700">Due today</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

RemindersList.displayName = "/src/widgets/charts/reminders-list.tsx";

export default RemindersList;
