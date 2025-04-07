import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Dialog } from "@material-tailwind/react";
import { fetchInvoices } from "@/services/fetchInvoices";
import { fetchProducts } from '@/services/fetchProducts';
import MonthlyReportPreview from "./monthlyReport";
import ReactToPrint from "react-to-print";
import { fetchTaxes } from "@/services/fetchTaxes";

const schema = Yup.object().shape({
    startDate: Yup.string().required("Start date is required"),
});

function MonthlyReportForm({ open, close }) {
    const printRef = useRef();
    const reactToPrintTriggerRef = useRef();
    const { state } = State();
    const [products, setProducts] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showPrint, setShowPrint] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const handleClose = () => {
        clearForm(formikProps);
        close();
    };

    const showToastMessage = (type, message) => {

        if (type === 'success') {
            toast.success(message)
        }
        else if (type === 'info') {
            toast.info(message)
        }
        else {
            toast.error(message)
        }
    };

    const onSubmit = async (values) => {
        setIsLoading(true);
        try {
            const filteredInvoices = invoices?.filter(invoice => {
                return new Date(invoice.createdAt) >= new Date(values.startDate);
            });
            setReportData(filteredInvoices);
            setShowPrint(true);
            setTimeout(() => {
                reactToPrintTriggerRef.current?.click();
            }, 100);
            setIsLoading(false);
            handleClose();
        } catch (error) {
            console.log(error)
            setIsLoading(false);
            showToastMessage('error', 'Something went wrong');
            handleClose();
        }
    };

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

    const getProducts = async () => {
        try {
            const products = await (await fetchProducts(state.userToken)).json();
            setProducts(products.map(product => product.name));
        } catch (error) {
            console.log(error.message);
        }
    }

    const getInvoices = async () => {
        try {
            const fetchedInvoices = await fetchInvoices(state.userToken);
            const totalInvoices = await fetchedInvoices.json();
            setInvoices(totalInvoices.data.reverse());

        } catch (error) {
            console.log(error.message);
            showToastMessage('error', "Something went wrong");
        }
    };

    useEffect(() => {
        getTaxes();
        getProducts();
        getInvoices();
    }, []);

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                startDate: '',
            },
            errors: {
                startDate: '',
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            startDate: '',
        },
        validationSchema: schema,
        onSubmit,
    });

    const {
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
    } = formikProps;

    return (
        <>
            <Dialog open={open} >
                {open && (
                    <form onSubmit={handleSubmit} autoComplete="new" >
                        <div className="flex justify-center w-full">
                            <div className="bg-white rounded shadow-xl">
                                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <div></div>
                                    <div className="text-lg text-white font-medium" >
                                        Monthly Report
                                    </div>
                                    <button
                                        className="bg-transparent hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                                        onClick={handleClose}
                                        type="button"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="w-6 h-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="w-[40vw] p-6 space-y-4">
                                    <div className="basis-[50%]">
                                        <label className="font-bold">Start Date</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="startDate"
                                            name="startDate"
                                            type="date"
                                            value={values.startDate}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.startDate && errors.startDate) ? (
                                            <div className="text-red-500">
                                                {errors.startDate}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-2 sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <button
                                        className=" w-32 bg-gray-600 hover:bg-gray-900 text-white font-bold py-2 px-4"
                                        onClick={() => clearForm(formikProps)}
                                        type="button"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        disabled={isLoading}
                                        className="w-32 bg-gray-600 hover:bg-gray-900 text-white font-bold py-2 px-4"
                                        type="submit"
                                    >
                                        {!isLoading ?
                                            <span>Generate</span>
                                            :
                                            <div className="flex items-center justify-center h-fit">
                                                <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </Dialog>
            {showPrint && (
                <>
                    <MonthlyReportPreview
                        ref={printRef}
                        invoices={reportData}
                        products={products}
                        taxes={taxes}
                    />
                    <div className="hidden">
                        <ReactToPrint
                            trigger={() => <button ref={reactToPrintTriggerRef}>Print</button>}
                            content={() => printRef.current}
                        />
                    </div>
                </>
            )}
        </>
    );
}

export default MonthlyReportForm;