import React, { useEffect, useState } from 'react';
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@material-tailwind/react";
import { State } from '@/state/Context';
import { addPayment } from '@/services/addPayment';
import { fetchInvoice } from '@/services/fetchInvoice';

const schema = Yup.object().shape({
    paymentMethod: Yup.string().required("Payment Method is required"),
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
                paymentMethod: "",
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
            paymentMethod: "",
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
                            <div className="bg-white rounded shadow-xl">
                                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <div></div>
                                    <div className="text-white text-center text-lg">
                                        {edit ? "EDIT" : "NEW"} {"PAYMENT"}
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

                                <div className="w-[30vw] p-6 space-y-4">
                                    <div className="flex items-center justify-start space-x-4">
                                        <div className="">
                                            <label className="p-1 font-bold">Payment Method</label> <br />
                                            <select
                                                id="paymentMethod"
                                                name="paymentMethod"
                                                className="w-48 lg:w-72 p-2.5 border border-gray-300 bg-inherit rounded-md"
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
                                                <div className="text-red-500">
                                                    {errors.paymentMethod}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="">
                                            <label className="font-bold">Amount Paid</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
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
                                                <div className="text-red-500">
                                                    {errors.paidAmount}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {values.paymentMethod === "Card" && (
                                    <div className="w-full">
                                        <label className="font-bold">Card Number (optional)</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
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
                                            <span>{edit ? "Update" : "Save"}</span> :
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
export default PaymentForm;