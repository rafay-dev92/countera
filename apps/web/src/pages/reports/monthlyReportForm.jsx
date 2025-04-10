import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Dialog } from "@material-tailwind/react";
import { fetchInvoices } from "@/services/fetchInvoices";

const schema = Yup.object().shape({
    month: Yup.string().required("Month is required"),
});

function MonthlyReportForm({ open, close, setReportData }) {
    const reactToPrintTriggerRef = useRef();
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
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
            const startDate = new Date(values.month);
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

            const filteredInvoices = invoices?.filter(invoice => {
                return new Date(invoice.createdAt) >= startDate && new Date(invoice.createdAt) <= endDate;
            });
            if (filteredInvoices.length === 0) {
                showToastMessage('info', 'No invoices found for this month');
                setIsLoading(false);
                handleClose();
                return;
            }
            setReportData(filteredInvoices);
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

    const getInvoices = async () => {
        try {
            const fetchedInvoices = await fetchInvoices(state.userToken);
            const totalInvoices = await fetchedInvoices.json();
            const filteredInvoices = totalInvoices.data.filter(invoice => invoice.paymentStatus !== 'Void' && invoice.paymentStatus !== 'Refund');
            setInvoices(filteredInvoices.reverse());

        } catch (error) {
            console.log(error.message);
            showToastMessage('error', "Something went wrong");
        }
    };

    useEffect(() => {
        getInvoices();
    }, []);

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                month: '',
            },
            errors: {
                month: '',
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            month: '',
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
            <Dialog open={open} size="xs">
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

                                <div className="w-[25vw] p-6 space-y-4">
                                    <div >
                                        <label className="font-bold">Month</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="month"
                                            name="month"
                                            type="month"
                                            value={values.month}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.month && errors.month) ? (
                                            <div className="text-red-500">
                                                {errors.month}
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
        </>
    );
}

export default MonthlyReportForm;