import React, { useState, useEffect, useRef } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/solid';
import { Card, CardHeader, CardBody, Typography, Button, Select, Option } from "@material-tailwind/react";
import MonthlyReportForm from './monthlyReportForm';
import SalesByCustomerForm from './salesByCustomerForm';
import MonthlyReportPreview from './monthlyReport';
import { State } from '@/state/Context';
import { toast } from 'react-toastify';
import ReactToPrint from "react-to-print";
import { fetchTaxes } from "@/services/fetchTaxes";
import { fetchProductsCategories } from "@/services/fetchProductCategories";
import DailySalesReportForm from './dailySalesReportForm';
import ProductSalesForm from './productSalesForm';
import CustomerReportPreview from './customerReportReview';
import type { Tax, ProductCategory } from '@/types/api';

export function Reports() {
    const printRef = useRef<HTMLDivElement>(null);
    const { state } = State();
    const [productsCategories, setProductsCategories] = useState<string[]>([]);
    const [taxes, setTaxes] = useState<string[]>([]);

    const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
    const [isCustomerReportOpen, setIsCustomerReportOpen] = useState(false);
    const [isDailySalesOpen, setIsDailySalesOpen] = useState(false);
    const [isProductReportOpen, setIsProductReportOpen] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [filterValue, setFilterValue] = useState("");
    const [currentReport, setCurrentReport] = useState<string | null>(null); // null, 'customer', 'monthly', 'daily'

    const getTaxes = async () => {
        try {
            const res = (await fetchTaxes(state.userToken))!;
            const taxes = await res.json();
            if (res.status !== 200) {
                toast.error(taxes.message || "Failed to fetch taxes");
                return;
            }
            setTaxes(taxes.map((tax: Tax) => tax.name));
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong")
        }
    }

    const getProductCategories = async () => {
        try {
            const productsCategories = await (await fetchProductsCategories(state.userToken))!.json();
            setProductsCategories(productsCategories.map((cat: ProductCategory) => cat.name));
        } catch (error) {
            console.log((error as Error).message);
        }
    }

    useEffect(() => {
        if (Object.keys(state.userInfo).length !== 0 && (state.userInfo.Permission?.includes("report:read"))) {
            getTaxes();
            getProductCategories();
        }
    }, []);


    useEffect(() => {
        setFilteredData(reportData);
    }, [reportData]);

    const openReportForm = (reportType: string) => {
        if (window.innerWidth < 1600) {
            toast.info("Please use a screen width of 1600px or larger to view reports")
            return
        }
        switch (reportType) {
            case 'monthly':
                setIsMonthlyReportOpen(true);
                break;
            case 'daily':
                setIsDailySalesOpen(true);
                break;
            case 'customer':
                setIsCustomerReportOpen(true);
                break;
            default:
                toast.error("Not a relevant reprot type")
        }
    }

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
                {Object.keys(state.userInfo).length !== 0 && (state.userInfo.Permission?.includes("report:read") ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 mt-4'>
                        <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6">
                            <h2 className="text-sm md:text-base 2xl:text-[16px] font-semibold text-gray-800 text-center">Monthly Reports</h2>
                            <Button onClick={() => openReportForm('monthly')} className='cursor-pointer mt-2 sm:mt-3 p-1.5 sm:p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded text-[11px] md:text-xs 2xl:text-sm'>Generate</Button>
                        </CardBody>
                        <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6">
                            <h2 className="text-sm md:text-base 2xl:text-[16px] font-semibold text-gray-800 text-center">Daily Sales Reports</h2>
                            <Button onClick={() => openReportForm('daily')} className='cursor-pointer mt-2 sm:mt-3 p-1.5 sm:p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded ttext-[11px] md:text-xs 2xl:text-sm'>Generate</Button>
                        </CardBody>
                        <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6">
                            <h2 className="text-sm md:text-base 2xl:text-[16px] font-semibold text-gray-800 text-center">Customer Sales Reports</h2>
                            <Button onClick={() => openReportForm('customer')} className='cursor-pointer mt-2 sm:mt-3 p-1.5 sm:p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded text-[11px] md:text-xs 2xl:text-sm'>Generate</Button>
                        </CardBody>
                        {/* <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6">
                        <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 text-center">Product Sales Reports</h2>
                        <Button onClick={() => setIsProductReportOpen(true)} className='cursor-pointer mt-2 sm:mt-3 p-1.5 sm:p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded text-xs sm:text-sm lg:text-base'>Generate</Button>
                    </CardBody> */}
                    </div>
                ) : (
                    <div className="text-red-500 text-center mt-10">
                        <Typography variant="h6">You do not have permission to view this page.</Typography>
                    </div>
                ))}
            </Card>
            <MonthlyReportForm open={isMonthlyReportOpen} close={() => setIsMonthlyReportOpen(false)} setReportData={setReportData} onReportGenerated={() => setCurrentReport('monthly')} />
            <SalesByCustomerForm open={isCustomerReportOpen} close={() => setIsCustomerReportOpen(false)} setReportData={setReportData} onReportGenerated={() => setCurrentReport('customer')} />
            <DailySalesReportForm open={isDailySalesOpen} close={() => setIsDailySalesOpen(false)} setReportData={setReportData} onReportGenerated={() => setCurrentReport('daily')} />
            {/* <ProductSalesForm open={isProductReportOpen} close={() => setIsProductReportOpen(false)} setReportData={setReportData} /> */}
            {reportData.length > 0 && (
                <div className='flex flex-col justify-center mt-4'>
                    <div className="flex justify-between gap-4">
                        {currentReport !== 'customer' ? (
                            <div className="w-1/4 min-w-0">
                                <Select
                                    label="Filter By Payment Method"
                                    onChange={(value) => {
                                        setFilterValue(value as string);
                                        if (value === "") {
                                            setFilteredData(reportData);
                                            return;
                                        }
                                        const filteredData = reportData.filter(invoice =>
                                            invoice.Payments.some((item: any) => item.paymentMethod === value)
                                        );
                                        if (filteredData.length === 0) {
                                            toast.info("No data found for this payment method");
                                            return;
                                        }
                                        setFilteredData(filteredData);
                                    }}
                                >
                                    <Option value="">All</Option>
                                    <Option value="Cash">Cash</Option>
                                    <Option value="Card">Card</Option>
                                    <Option value="Check">Check</Option>
                                </Select>
                            </div>
                        )
                            :

                            <div>

                            </div>
                        }
                        <div className="flex">
                            <Button
                                onClick={() => {
                                    setReportData([]);
                                    setCurrentReport(null);
                                }}
                                className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-4 rounded mr-2"
                            >
                                Close
                            </Button>
                            <ReactToPrint
                                trigger={() => (
                                    <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded">
                                        Print
                                    </Button>
                                )}
                                content={() => printRef.current}
                            />
                        </div>
                    </div>

                    {currentReport === 'customer' ? (
                        <CustomerReportPreview
                            ref={printRef}
                            invoices={filteredData}
                            productsCategories={productsCategories}
                            taxes={taxes}
                        />
                    ) : currentReport === 'monthly' || 'daily' ? (
                        <MonthlyReportPreview
                            ref={printRef}
                            filterValue={filterValue}
                            invoices={filteredData}
                            productsCategories={productsCategories}
                            taxes={taxes}
                        />
                    ) : null}
                </div>
            )}
        </>
    );
};

export default Reports;
