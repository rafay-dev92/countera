import React, { useEffect, useState } from "react";
import { Dialog } from "@material-tailwind/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { addTax } from "@/services/addTax";
import { updateTax } from "@/services/updateTax";
import { State } from "@/state/Context";
import { toast } from "react-toastify";

const schema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    rate: Yup.number().required("Rate is required"),
    type: Yup.string().required("Type is required"),
    default: Yup.boolean(),
});

function TaxForm({ taxData, setTaxData, open, close, refresh, setRefresh }) {

    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        if (taxData) {
            formikProps.setValues(taxData);
            setEdit(true);
        }
    }, [taxData]);

    const handleClose = () => {
        clearForm(formikProps);
        setEdit(false);
        setTaxData(null);
        close();
    };

    const onSubmit = async (values) => {
        setIsLoading(true);
        const updatedData = { ...values, BusinessId: state.business.id }
        try {
            if (!edit) {
                // saving tax data
                const res = await addTax(updatedData, state.userToken);
                const tax = await res.json();
                if (res.status === 200) {
                    toast.success(tax.message)
                }
                else if (res.status === 409) {
                    toast.error(tax.message)
                }
            }
            else {
                const res = await updateTax(taxData.id, updatedData, state.userToken);
                const tax = await res.json();
                if (res.status === 200) {
                    toast.success(tax.message)
                }
                else if (res.status === 404) {
                    toast.info(tax.message)
                }
                else if (res.status === 409) {
                    toast.error(tax.message)
                }
            }

            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        }
    };

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                name: "",
                rate: "",
                type: "",
                default: false,
            },
            errors: {
                name: "",
                rate: "",
                type: "",
                default: false,
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            name: "",
            rate: "",
            type: "",
            default: false,
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
    } = formikProps;

    const options = [
        { value: '%', label: '%' },
        { value: '$', label: '$' },
    ];

    return (
        <>
            <Dialog open={open} >
                {open && (
                    <form autoComplete="new">
                        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className="text-[15px] font-semibold text-slate-900">
                                        {edit ? "Edit tax" : "New tax"}
                                    </div>
                                    <button
                                        className=" rounded-md p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
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
                                    <div className="flex items-center justify-start space-x-4">
                                        <div className="basis-[50%]">
                                            <label className="text-[13px] font-medium text-slate-700">Name</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={values.name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {(touched.name && errors.name) ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.name}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="basis-[50%]">
                                            <label className="text-[13px] font-medium text-slate-700">Rate</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="rate"
                                                name="rate"
                                                type="number"
                                                value={values.rate}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.rate && errors.rate ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.rate}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <label className="text-[13px] font-medium text-slate-700">Type</label> <br />
                                        <select
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="type"
                                            name="type"
                                            type="text"
                                            value={values.type}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        >
                                            <option value="">Select Type</option>
                                            {options.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {touched.type && errors.type ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.type}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
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
                                        onClick={() => onSubmit(values)}
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

export default TaxForm;