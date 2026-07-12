import React from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
} from "@material-tailwind/react";
import PropTypes from "prop-types";
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';

export function AppointmentsList({ color, title, appointments }) {
    if (!appointments || appointments.length === 0) {
        return (
            <Card className="border border-blue-gray-100 shadow-sm">
                <CardHeader variant="gradient" color={color} floated={false} shadow={false} className="h-12">
                    <div className="flex items-center justify-between">
                        <Typography variant="h6" color="black" className="flex items-center gap-2">
                            {title}
                            <span className="rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold ml-2 bg-red-600 text-white">
                                {appointments.length}
                            </span>
                        </Typography>
                    </div>
                </CardHeader>
                <CardBody className="px-6 pt-4">
                    <div className="text-center py-8">
                        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <Typography variant="h6" color="gray" className="mb-2">
                            No Appointments Today
                        </Typography>
                        <Typography variant="small" color="gray" className="font-normal">
                            You're all caught up! No appointments for today.
                        </Typography>
                    </div>
                </CardBody>
            </Card>
        );
    }

    const getRandomHexColor = () => {
        const colors = ['#e63946', '#457b9d', '#2a9d8f', '#ffb703', '#8e44ad'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <Card className="border border-blue-gray-100 shadow-sm ">
            <CardHeader variant="gradient" color={color} floated={false} shadow={false} className="h-12">
                <div className="flex items-center justify-between">
                    <Typography variant="h6" color="black" className="flex items-center gap-2">
                        {title}
                        <span className="rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold ml-2 bg-red-600 text-white">
                            {appointments.length}
                        </span>
                    </Typography>
                </div>
            </CardHeader>
            <CardBody className="px-6 pt-4 h-48 overflow-y-auto">
                <div className="space-y-3">
                    {appointments.map((appointment, index) => {
                        const formatTime = (isoString) => {
                            const date = new Date(isoString);
                            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        };
                        return (
                            <div key={index} className="flex flex-col space-y-3 p-3 bg-gray-100 rounded-lg">
                                <div className='flex items-center justify-between w-full'>
                                    <div className="flex items-center gap-3">
                                        <div style={{ backgroundColor: getRandomHexColor() }} className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold uppercase">
                                            {appointment.customerName?.charAt(0)}
                                        </div>
                                        <Typography variant="medium" color="blue-gray" className="font-semibold uppercase">
                                            {appointment.customerName}
                                        </Typography>
                                    </div>
                                    <div className='flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full'>
                                        <ClockIcon className='h-5 w-5' />
                                        <Typography variant="small" className="font-semibold">
                                            {formatTime(appointment.startDateTime)} - {formatTime(appointment.endDateTime)}
                                        </Typography>
                                    </div>
                                </div>
                                <Typography variant="small" color="gray" className="text-sm font-normal truncate">{appointment.description}</Typography>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card >
    );
}

AppointmentsList.defaultProps = {
    color: "blue",
    reminders: [],
};

AppointmentsList.propTypes = {
    color: PropTypes.oneOf([
        "white",
        "blue-gray",
        "gray",
        "brown",
        "deep-orange",
        "orange",
        "amber",
        "yellow",
        "lime",
        "light-green",
        "green",
        "teal",
        "cyan",
        "light-blue",
        "blue",
        "indigo",
        "deep-purple",
        "purple",
        "pink",
        "red",
    ]),
    title: PropTypes.node.isRequired,
    reminders: PropTypes.array,
};

AppointmentsList.displayName = "/src/widgets/charts/appointments-list.jsx";

export default AppointmentsList; 