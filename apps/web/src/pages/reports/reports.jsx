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

export function Reports() {
    const printRef = useRef();
    const { state } = State();
    const [productsCategories, setProductsCategories] = useState([]);
    const [taxes, setTaxes] = useState([]);

    const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
    const [isCustomerReportOpen, setIsCustomerReportOpen] = useState(false);
    const [showCustomerReport, setShowCustomerReport] = useState(false);
    const [isDailySalesOpen, setIsDailySalesOpen] = useState(false);
    const [isProductReportOpen, setIsProductReportOpen] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filterValue, setFilterValue] = useState("");
    const getTaxes = async () => {
        try {
            const res = await fetchTaxes(state.userToken);
            const taxes = await res.json();
            setTaxes(taxes.map(tax => tax.name));
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong")
        }
    }

    const getProductCategories = async () => {
        try {
            const productsCategories = await (await fetchProductsCategories(state.userToken)).json();
            setProductsCategories(productsCategories.map(cat => cat.name));
        } catch (error) {
            console.log(error.message);
        }
    }

    useEffect(() => {
        getTaxes();
        getProductCategories();
    }, []);


    useEffect(() => {
        // setOriginalData(reportData);
        setFilteredData(reportData);
    }, [reportData]);
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
                        <h2 className="text-lg font-semibold text-gray-800">Daily Sales Reports</h2>
                        <Button onClick={() => setIsDailySalesOpen(true)} className='cursor-pointer mt-3 p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded'>Generate</Button>
                    </CardBody>
                    <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center">
                        <h2 className="text-lg font-semibold text-gray-800">Customer Sales Reports</h2>
                        <Button onClick={() => { setIsCustomerReportOpen(true); setShowCustomerReport(true); }} className='cursor-pointer mt-3 p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded'>Generate</Button>
                    </CardBody>
                    {/* <CardBody className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center">
                        <h2 className="text-lg font-semibold text-gray-800">Product Sales Reports</h2>
                        <Button onClick={() => setIsProductReportOpen(true)} className='cursor-pointer mt-3 p-2 hover:bg-gray-600 hover:text-white w-full text-center font-medium rounded'>Generate</Button>
                    </CardBody> */}
                </div>
            </Card>
            <MonthlyReportForm open={isMonthlyReportOpen} close={() => setIsMonthlyReportOpen(false)} setReportData={setReportData} />
            <SalesByCustomerForm open={isCustomerReportOpen} close={() => setIsCustomerReportOpen(false)} setReportData={setReportData} />
            <DailySalesReportForm open={isDailySalesOpen} close={() => setIsDailySalesOpen(false)} setReportData={setReportData} />
            {/* <ProductSalesForm open={isProductReportOpen} close={() => setIsProductReportOpen(false)} setReportData={setReportData} /> */}
            {reportData.length > 0 && (
                <div className='flex flex-col justify-center mt-4'>
                    <div className="flex justify-between gap-4">
                        <div className="w-1/4 min-w-0">
                            <Select
                                label="Filter By Payment Method"
                                onChange={(value) => {
                                    setFilterValue(value);
                                    if (value === "") {
                                        setFilteredData(reportData);
                                        return;
                                    }
                                    const filteredData = reportData.filter(invoice =>
                                        invoice.Payments.some(item => item.paymentMethod === value)
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

                        <div className="flex">
                            <Button
                                onClick={() => {
                                    setReportData([]);
                                    setShowCustomerReport(false);
                                }}
                                className="bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-4 rounded mr-2"
                            >
                                Close
                            </Button>
                            <ReactToPrint
                                trigger={() => (
                                    <Button className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded">
                                        Print
                                    </Button>
                                )}
                                content={() => printRef.current}
                            />
                        </div>
                    </div>

                    {showCustomerReport ? (
                        <CustomerReportPreview
                            ref={printRef}
                            invoices={filteredData}
                            productsCategories={productsCategories}
                            taxes={taxes}
                        />
                    ) : (
                        <MonthlyReportPreview
                            ref={printRef}
                            filterValue={filterValue}
                            invoices={filteredData}
                            productsCategories={productsCategories}
                            taxes={taxes}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default Reports;
