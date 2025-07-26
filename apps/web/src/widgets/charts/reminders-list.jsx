import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
} from "@material-tailwind/react";
import PropTypes from "prop-types";
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export function RemindersList({ color, title, reminders }) {
  if (!reminders || reminders.length === 0) {
    return (
      <Card className="border border-blue-gray-100 shadow-sm">
        <CardHeader variant="gradient" color={color} floated={false} shadow={false} className="h-12">
          <div className="flex items-center justify-between">
          <Typography variant="h6" color="black" className="flex items-center gap-2">
            {title}
            <span className="rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold ml-2 bg-red-600 text-white">
              {reminders.length}
            </span>
          </Typography>
          </div>
        </CardHeader>
        <CardBody className="px-6 pt-4">
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Typography variant="h6" color="gray" className="mb-2">
              No Reminders Today
            </Typography>
            <Typography variant="small" color="gray" className="font-normal">
              You're all caught up! No replacement reminders for today.
            </Typography>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-blue-gray-100 shadow-sm ">
      <CardHeader variant="gradient" color={color} floated={false} shadow={false} className="h-12">
        <div className="flex items-center justify-between">
          <Typography variant="h6" color="black" className="flex items-center gap-2">
            {title}
            <span className="rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold ml-2 bg-red-600 text-white">
              {reminders.length}
            </span>
          </Typography>
        </div>
      </CardHeader>
      <CardBody className="px-6 pt-4 h-48 overflow-y-auto">
        <div className="space-y-3">
          {reminders.map((reminder, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar
                src={reminder.Invoice?.Customer?.Business?.logo || undefined}
                alt={reminder.Invoice?.Customer?.Business?.name || "Business"}
                size="sm"
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <Typography variant="small" color="blue-gray" className="font-semibold truncate">
                    {reminder.Invoice?.Customer?.firstName} {reminder.Invoice?.Customer?.lastName}
                  </Typography>
                  <Typography variant="small" color="gray" className="text-xs">
                    Invoice #{reminder.Invoice?.invoiceNumber || reminder.Invoice?.id?.slice(-8)}
                  </Typography>
                </div>
                <Typography variant="small" color="gray" className="font-normal">
                  {reminder.Product?.name}
                </Typography>
                <div className="flex items-center justify-between mt-1">
                  <Typography variant="small" color="gray" className="text-xs">
                    {reminder.Invoice?.Customer?.Business?.name}
                  </Typography>
                  <Typography color="gray" className="text-sm font-medium">
                    Due Today
                  </Typography>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

RemindersList.defaultProps = {
  color: "blue",
  reminders: [],
};

RemindersList.propTypes = {
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

RemindersList.displayName = "/src/widgets/charts/reminders-list.jsx";

export default RemindersList; 