import React, { useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/solid';
import { Card, CardHeader, CardBody, Typography, Button } from "@material-tailwind/react";
import MonthlyReportForm from './monthlyReportForm';
import SalesByCustomerForm from './salesByCustomerForm';

export function Reports() {
    const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
    const [isCustomerReportOpen, setIsCustomerReportOpen] = useState(false);
    return (
        <>
        <Card className="h-full w-full">
            <CardHeader floated={false} shadow={false} className="rounded-none">
                <div className="mb-4 sm:mb-0 flex items-center">
                    <Typography variant="h5" color="blue-gray" className="flex items-center">
                        <ChartBarIcon className="h-12 w-12 text-blueGray-500 ml-2" />
                        Reports
                    </Typography>
                </div>
            </CardHeader>
            <div className='grid grid-cols-3 sm:grid-cols-4 gap-4 p-4 mt-4'>
                <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center">                
                    <h2 className="text-lg font-semibold text-gray-800">Monthly Reports</h2>
                    <Button onClick={() => setIsMonthlyReportOpen(true)} className='cursor-pointer mt-3 p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded'>Generate</Button>
                </CardBody>

                <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center">                
                    <h2 className="text-lg font-semibold text-gray-800">Customer Sales Reports</h2>
                    <Button onClick={() => setIsCustomerReportOpen(true)} className='cursor-pointer mt-3 p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded'>Generate</Button>
                </CardBody>
            </div>
        </Card>
        <MonthlyReportForm open={isMonthlyReportOpen} close={() => setIsMonthlyReportOpen(false)} />
        <SalesByCustomerForm open={isCustomerReportOpen} close={() => setIsCustomerReportOpen(false)} />
        </>
    );
};

export default Reports;
