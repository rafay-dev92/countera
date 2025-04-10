import React, { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    Select,
    Option,
    Checkbox,
} from "@material-tailwind/react";
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
                            <div className="bg-white rounded shadow-xl">
                                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <div></div>
                                    <div className="text-white text-center text-lg">
                                        {edit ? "EDIT TAX" : "NEW TAX"}
                                    </div>
                                    <button
                                        className=" bg-transparent hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
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
                                            <label className="font-bold">Name</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={values.name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {(touched.name && errors.name) ? (
                                                <div className="text-red-500">
                                                    {errors.name}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="basis-[50%]">
                                            <label className="font-bold">Rate</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="rate"
                                                name="rate"
                                                type="text"
                                                value={values.rate}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.rate && errors.rate ? (
                                                <div className="text-red-500">
                                                    {errors.rate}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        <label className="font-bold">Type</label> <br />
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
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
                                            <div className="text-red-500">
                                                {errors.type}
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
                                        onClick={() => onSubmit(values)}
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

export default TaxForm;