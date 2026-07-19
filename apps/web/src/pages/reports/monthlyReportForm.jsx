import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Dialog } from "@material-tailwind/react";
import { fetchInvoices } from "@/services/fetchInvoices";
import moment from 'moment-timezone';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PaymentStatus } from "@countera/shared";

const schema = Yup.object().shape({
    month: Yup.string().required("Month is required"),
});

function MonthlyReportForm({ open, close, setReportData, onReportGenerated }) {
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
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
            const timezone = state.business.timezone;
            const selectedMonth = new Date(values.month);

            const startDate = moment.tz({
                year: selectedMonth.getFullYear(),
                month: selectedMonth.getMonth(),
                day: 1
            }, timezone).startOf('day').utc().toDate();

            const endDate = moment.tz({
                year: selectedMonth.getFullYear(),
                month: selectedMonth.getMonth(),
                day: moment(selectedMonth).daysInMonth()
            }, timezone).endOf('day').utc().toDate();
            const filters = { paymentStatus: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID], startDate, endDate, isReport: true, order: 'ASC' }

            // fetch invoices
            const fetchedInvoices = await fetchInvoices(state.userToken, null, null, filters);
            const totalInvoices = await fetchedInvoices.json();

            if (totalInvoices?.data.length === 0) {
                showToastMessage('info', 'No invoices found for this month');
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
                                        Monthly Report
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
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[13px] font-medium text-slate-700">Month</label>
                                        <DatePicker
                                            id="month"
                                            name="month"
                                            selected={values.month}
                                            onChange={(date) => setFieldValue("month", date)}
                                            onBlur={handleBlur}
                                            dateFormat="yyyy-MM"
                                            showMonthYearPicker
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                        />
                                        {(touched.month && errors.month) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.month}
                                            </div>
                                        ) : (<div></div>)}
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

export default MonthlyReportForm;