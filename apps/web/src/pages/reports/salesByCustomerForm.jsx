import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Dialog } from "@material-tailwind/react";
import { fetchInvoices } from "@/services/fetchInvoices";
import { fetchCustomers } from "@/services/fetchCustomers";
import moment from 'moment-timezone';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const schema = Yup.object().shape({
    customer: Yup.string().required("Customer is required"),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', {
            is: (val) => !!val,
            then: (schema) =>
                schema
                    .required('End date is required if start date is selected')
                    .min(Yup.ref('startDate'), 'End date cannot be before start date'),
            otherwise: (schema) => schema.nullable(),
        }),
});

function SalesByCustomerForm({ open, close, setReportData, onReportGenerated }) {
    const customerInputRef = useRef();
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    const handleClose = () => {
        setSelectedCustomer(null)
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
            const timezone = state.business.timezone;
            let startDate = values.startDate ? moment.tz(values.startDate, timezone).startOf('day').utc().toDate() : null;
            let endDate = values.endDate ? moment.tz(values.endDate, timezone).endOf('day').utc().toDate() : null;
            // If neither date is set, pass null for both
            if (!startDate && !endDate) {
                startDate = null;
                endDate = null;
            }
            const filters = {
                paymentStatus: ['Paid', 'Partially Paid'],
                CustomerId: values.customer,
                startDate,
                endDate,
                isReport: true,
                order: 'ASC'
            };
            const fetchedInvoices = await fetchInvoices(state.userToken, null, null, filters);
            const totalInvoices = await fetchedInvoices.json();
            if (totalInvoices?.data?.length === 0) {
                showToastMessage('info', 'No invoices found for this customer in this date range');
                setIsLoading(false);
                return;
            }
            setReportData(totalInvoices?.data);
            if (onReportGenerated) onReportGenerated();
            setIsLoading(false);
            handleClose();
        } catch (error) {
            console.log(error)
            setIsLoading(false);
            showToastMessage('error', 'Something went wrong');
            handleClose();
        }
    };

    const getCustomers = async () => {
        const fetchedCustomers = await fetchCustomers(state.userToken);
        const customersData = await fetchedCustomers.json();
        setCustomers(customersData);
    };

    useEffect(() => {
        getCustomers();
    }, []);

    const handleCustomerChange = (customer) => {
        setSelectedCustomer(customer);
        if (customer) {
            setValues({ ['customer']: customer.id });
        };
        setShowCustomerSuggestions(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (customerInputRef.current && !customerInputRef.current.contains(event.target)) {
                setShowCustomerSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                customer: '',
                startDate: null,
                endDate: null,
            },
            errors: {
                customer: '',
                startDate: '',
                endDate: '',
            },
        });
        setSelectedCustomer(null);
    };

    const formikProps = useFormik({
        initialValues: {
            customer: '',
            startDate: null,
            endDate: null,
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
        setValues,
        setFieldValue,
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
                                        Customer Sales Report
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
                                    <div className="relative flex flex-col" ref={customerInputRef}>
                                        <label className="font-bold">Customer</label>
                                        <input
                                            className="relative h-[97%] mt-1 p-2 border border-gray-300 rounded-md text-gray-600 font-small focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="customer"
                                            name="customer"
                                            type="text"
                                            value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : values.customer}
                                            onClick={() => { setShowCustomerSuggestions(true); setValues({ ['customer']: '' }) }}
                                            onChange={(e) => { setSelectedCustomer(null); handleChange(e) }}
                                            onBlur={handleBlur}
                                            autoComplete="off"
                                            placeholder="Select Customer"
                                        />                                        
                                        {showCustomerSuggestions && (
                                            <ul className="d-block absolute z-50 bg-white border border-slate-700 w-full top-full mt-1 overflow-y-auto min-h-24 max-h-48 ">
                                                {customers.length > 0 ?
                                                    customers
                                                        .filter(customer => {
                                                            const searchTerm = values.customer.trim().toLowerCase();
                                                            return (
                                                                `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm) ||
                                                                customer.phone?.toLowerCase().includes(searchTerm)
                                                            );
                                                        })
                                                        .map(customer => (
                                                            <li
                                                                key={customer.id}
                                                                className="cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-200"
                                                                onClick={() => handleCustomerChange(customer)}
                                                            >
                                                                {customer.firstName} {customer.lastName}
                                                            </li>
                                                        ))
                                                    :
                                                    <li className="px-2 py-1 rounded-sm">No Customer</li>
                                                }
                                            </ul>
                                        )}
                                        {(touched.customer && errors.customer) ? (
                                            <div className="text-red-500">{errors.customer}</div>
                                        ) : (<div></div>)}
                                    </div>
                                    <div className="flex gap-x-2">
                                        <div className="flex flex-col gap-1 w-1/2">
                                            <label className="font-bold">Start Date</label>
                                            <DatePicker
                                                id="startDate"
                                                name="startDate"
                                                selected={values.startDate}
                                                onChange={(date) => setFieldValue("startDate", date || null)}
                                                onBlur={handleBlur}
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText="Select start date"
                                            />
                                            {(touched.startDate && errors.startDate) ? (
                                                <div className="text-red-500">{errors.startDate}</div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="flex flex-col gap-1 w-1/2 mt-0">
                                            <label className="font-bold">End Date</label>
                                            <DatePicker
                                                id="endDate"
                                                name="endDate"
                                                selected={values.endDate}
                                                onChange={(date) => setFieldValue("endDate", date || null)}
                                                onBlur={handleBlur}
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText="Select end date"
                                                minDate={values.startDate}
                                            />
                                            {(touched.endDate && errors.endDate) ? (
                                                <div className="text-red-500">{errors.endDate}</div>
                                            ) : (<div></div>)}
                                        </div>
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

export default SalesByCustomerForm;