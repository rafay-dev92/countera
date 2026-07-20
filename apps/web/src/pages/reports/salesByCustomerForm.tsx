import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Dialog } from "@/widgets/mt";
import { fetchInvoices } from "@/services/fetchInvoices";
import { fetchCustomers } from "@/services/fetchCustomers";
import moment from 'moment-timezone';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PaymentStatus } from "@countera/shared";
import type { Customer } from "@/types/api";

const schema = Yup.object().shape({
    customer: Yup.string().required("Customer is required"),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', {
            is: (val: unknown) => !!val,
            then: (schema) =>
                schema
                    .required('End date is required if start date is selected')
                    .min(Yup.ref('startDate'), 'End date cannot be before start date'),
            otherwise: (schema) => schema.nullable(),
        }),
});

interface SalesByCustomerFormValues {
    customer: string;
    startDate: Date | null;
    endDate: Date | null;
}

interface SalesByCustomerFormProps {
    open: boolean;
    close: () => void;
    setReportData: React.Dispatch<React.SetStateAction<any[]>>;
    onReportGenerated: () => void;
}

function SalesByCustomerForm({ open, close, setReportData, onReportGenerated }: SalesByCustomerFormProps) {
    const customerInputRef = useRef<HTMLDivElement>(null);
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    const handleClose = () => {
        setSelectedCustomer(null)
        clearForm(formikProps);
        close();
    };

    const showToastMessage = (type: string, message: string) => {

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

    const onSubmit = async (values: SalesByCustomerFormValues) => {
        setIsLoading(true);
        try {
            const timezone = state.business!.timezone as string;
            let startDate = values.startDate ? moment.tz(values.startDate, timezone).startOf('day').utc().toDate() : null;
            let endDate = values.endDate ? moment.tz(values.endDate, timezone).endOf('day').utc().toDate() : null;
            // If neither date is set, pass null for both
            if (!startDate && !endDate) {
                startDate = null;
                endDate = null;
            }
            const filters = {
                paymentStatus: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID],
                CustomerDetails: {
                    id: values.customer,
                },
                startDate,
                endDate,
                isReport: true,
                order: 'ASC'
            };
            const fetchedInvoices = await fetchInvoices(state.userToken, null, null, filters as any);
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
        const fetchedCustomers = (await fetchCustomers(state.userToken))!;
        const customersData = await fetchedCustomers.json();
        setCustomers(customersData);
    };

    useEffect(() => {
        getCustomers();
    }, []);

    const handleCustomerChange = (customer: Customer) => {
        setSelectedCustomer(customer);
        if (customer) {
            setValues({ ['customer']: customer.id } as any);
        };
        setShowCustomerSuggestions(false);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (customerInputRef.current && !customerInputRef.current.contains(event.target as Node)) {
                setShowCustomerSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const clearForm = (formikProps: ReturnType<typeof useFormik<SalesByCustomerFormValues>>) => {
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

    const formikProps = useFormik<SalesByCustomerFormValues>({
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
                        <div className="">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center justify-between sticky bg-slate-50 px-2 py-1.5">
                                    <div></div>
                                    <div className="text-lg text-white font-medium" >
                                        Customer Sales Report
                                    </div>
                                    <button
                                        className="rounded-md p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
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

                                <div className="p-6 space-y-4">
                                    <div className="relative flex flex-col" ref={customerInputRef}>
                                        <label className="text-[13px] font-medium text-slate-700">Customer</label>
                                        <input
                                            className="relative h-[97%] mt-1 p-2 border border-gray-300 rounded-md text-gray-600 font-small focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="customer"
                                            name="customer"
                                            type="text"
                                            value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : values.customer}
                                            onClick={() => { setShowCustomerSuggestions(true); setValues({ ['customer']: '' } as any) }}
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
                                            <div className="mt-1 text-xs text-red-600">{errors.customer}</div>
                                        ) : (<div></div>)}
                                    </div>
                                    <div className="flex gap-x-2">
                                        <div className="flex flex-col gap-1 w-1/2">
                                            <label className="text-[13px] font-medium text-slate-700">Start Date</label>
                                            <DatePicker
                                                id="startDate"
                                                name="startDate"
                                                selected={values.startDate}
                                                onChange={(date) => setFieldValue("startDate", date || null)}
                                                onBlur={handleBlur}
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText="Select start date"
                                            />
                                            {(touched.startDate && errors.startDate) ? (
                                                <div className="mt-1 text-xs text-red-600">{errors.startDate}</div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="flex flex-col gap-1 w-1/2 mt-0">
                                            <label className="text-[13px] font-medium text-slate-700">End Date</label>
                                            <DatePicker
                                                id="endDate"
                                                name="endDate"
                                                selected={values.endDate}
                                                onChange={(date) => setFieldValue("endDate", date || null)}
                                                onBlur={handleBlur}
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                dateFormat="yyyy-MM-dd"
                                                placeholderText="Select end date"
                                                minDate={values.startDate as any}
                                            />
                                            {(touched.endDate && errors.endDate) ? (
                                                <div className="mt-1 text-xs text-red-600">{errors.endDate}</div>
                                            ) : (<div></div>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-2 sticky bg-slate-50 px-2 py-1.5">
                                    <button
                                        className=" w-28 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                                        onClick={() => clearForm(formikProps)}
                                        type="button"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        disabled={isLoading}
                                        className="w-28 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                                        type="submit"
                                    >
                                        {!isLoading ?
                                            <span>Generate</span>
                                            :
                                            <div className="flex items-center justify-center h-fit">
                                                <div className="w-6 h-6 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
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