import React from 'react';
import PropTypes from "prop-types";
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';

export function AppointmentsList({ title, appointments }) {
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                    {appointments?.length ?? 0}
                </span>
            </div>

            {!appointments || appointments.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                    <CalendarDaysIcon className="mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">No appointments today</p>
                    <p className="mt-1 text-[13px] text-slate-500">
                        Nothing is scheduled for today.
                    </p>
                </div>
            ) : (
                <div className="max-h-72 flex-1 divide-y divide-slate-100 overflow-y-auto">
                    {appointments.map((appointment, index) => (
                        <div key={index} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold uppercase text-teal-700">
                                        {appointment.customerName?.charAt(0)}
                                    </span>
                                    <p className="truncate text-[13.5px] font-medium text-slate-900">
                                        {appointment.customerName}
                                    </p>
                                </div>
                                <span className="flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums text-slate-600">
                                    <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                                    {formatTime(appointment.startDateTime)} – {formatTime(appointment.endDateTime)}
                                </span>
                            </div>
                            {appointment.description && (
                                <p className="mt-1.5 truncate pl-[38px] text-[13px] text-slate-600">
                                    {appointment.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

AppointmentsList.defaultProps = {
    appointments: [],
};

AppointmentsList.propTypes = {
    title: PropTypes.node.isRequired,
    appointments: PropTypes.array,
};

AppointmentsList.displayName = "/src/widgets/charts/appointments-list.jsx";

export default AppointmentsList;
