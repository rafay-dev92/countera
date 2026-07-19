import React, { useEffect, useState } from 'react';
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@material-tailwind/react";
import { State } from '@/state/Context';
import { addPayment } from '@/services/addPayment';
import { fetchInvoice } from '@/services/fetchInvoice';

const schema = Yup.object().shape({
    paymentMethod: Yup.string().default("Card").required("Payment Method is required"),
    paidAmount: Yup.number().required("Amount is required"),
    cardNumber: Yup.string(),
});

const PaymentForm = ({ open, close, totalAmount, totalAmountPaid, invoiceId, setPrintInvoice }) => {
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);

    const onSubmit = async (values) => {
        setIsLoading(true);
        const data = { ...values, totalAmount: parseFloat(totalAmount), InvoiceId: invoiceId };
        try {
            const res = await addPayment(data, state.userToken);
            const payment = await res.json();
            if (res.status === 200) {
                const invoice = await fetchInvoice(payment.InvoiceId, state.userToken);
                const inv = await invoice.json();
                setPrintInvoice(inv.data);
            }
            handleClose();
        } catch (error) {
            console.log(error);
        }
        setIsLoading(false);
    }

    const handleClose = () => {
        clearForm(formikProps);
        close();
    }

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                paymentMethod: "Card",
                paidAmount: "",
                cardNumber: "",
            },
            errors: {
                paymentMethod: "",
                paidAmount: "",
                cardNumber: "",
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            paymentMethod: "Card",
            paidAmount: "",
            cardNumber: "",
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

    useEffect(() => {
        formikProps.setValues((prevValues) => ({
            ...prevValues,
            paidAmount: parseFloat((totalAmount - totalAmountPaid).toFixed(2)),
        }));
    }, [totalAmount, totalAmountPaid, open]);

    return (
        <>
            <Dialog size='xs' open={open} >
                {open && (
                    <form onSubmit={handleSubmit} autoComplete="new" >
                        <div className="flex justify-center w-full">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] 2xl:w-[50vw]">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className="text-[15px] font-semibold text-slate-900">
                                        {edit ? "Edit payment" : "New payment"}
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
                                    <div className="flex items-center justify-between space-x-4">
                                        <div className="">
                                            <label className="text-[13px] font-medium text-slate-700">Payment Method</label> <br />
                                            <select
                                                id="paymentMethod"
                                                name="paymentMethod"
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                value={values.paymentMethod}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            >
                                                <option value="">Select Payment Method</option>
                                                <option value="Cash">Cash</option>
                                                <option value="Check">Check</option>
                                                <option value="Card">Card</option>
                                            </select>
                                            {touched.paymentMethod && errors.paymentMethod ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.paymentMethod}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="">
                                            <label className="text-[13px] font-medium text-slate-700">Amount</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="paidAmount"
                                                name="paidAmount"
                                                type="number"
                                                value={values.paidAmount}
                                                onChange={(e) => {
                                                    const maxValue = parseFloat((totalAmount - totalAmountPaid).toFixed(2));
                                                    const value =
                                                        Math.min(maxValue, parseInt(e.target.value, 10) || "") === 0
                                                            ? ""
                                                            : Math.min(maxValue, parseInt(e.target.value, 10) || "");
                                                    setFieldValue("paidAmount", value);
                                                }}
                                                onBlur={handleBlur}
                                            />
                                            {touched.paidAmount && errors.paidAmount && (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.paidAmount}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {values.paymentMethod === "Card" && (
                                        <div className="w-full">
                                            <label className="text-[13px] font-medium text-slate-700">Card Number (optional)</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="cardNumber"
                                                name="cardNumber"
                                                type="text"
                                                value={values.cardNumber}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
                                    <button
                                        className="w-auto rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60"
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
                                            <span>{edit ? "Update" : "Save"}</span> :
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
export default PaymentForm;