import React, { useState, useRef } from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog, DialogHeader, DialogFooter, DialogBody, Button, Input } from "@material-tailwind/react";
import { addVehicle } from "@/services/addVehicle";
import { updateVehicle } from "@/services/updateVehicle";
import { toast } from 'react-toastify';
import { State } from "@/state/Context";

const schema = Yup.object().shape({
    make: Yup.string().required("Make is required"),
    model: Yup.string().required("Model is required"),
});

const MyPopUpForm = ({ open, close, selectedItem, setSelectedItem, refresh, setRefresh }) => {
    const { state } = State();
    const [edit, setEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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


    const handleClose = () => {
        clearForm(formikProps);
        setEdit(false);
        setSelectedItem(null);
        close();
    };

    useEffect(() => {
        if (selectedItem) {
            formikProps.setValues(selectedItem);
            setEdit(true);
        }
    }, [selectedItem]);

    const onSubmit = async (values) => {
        setIsLoading(true);
        try {
            if (!edit) {
                const res = await addVehicle(values, state.userToken)
                const vehicle = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', vehicle.message)
                }
                else if (res.status === 409) {
                    showToastMessage('error', vehicle.message)
                }
            }
            else {
                const res = await updateVehicle(selectedItem.id, values, state.userToken)
                const vehicle = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', vehicle.message)
                }
                else if (res.status === 404) {
                    showToastMessage('info', vehicle.message)
                }
                else if (res.status === 409) {
                    showToastMessage('error', vehicle.message)
                }
            }

            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        } catch (error) {
            console.log(error)
            setIsLoading(false);
            showToastMessage('error', 'Something went wrong')
        }
    };


    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                make: "",
                model: "",
            },
            errors: {
                make: "",
                model: "",
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            make: "",
            model: "",
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
        <Dialog open={open}>
            {open && (
                <form onSubmit={handleSubmit} autoComplete="new" >
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                <div className="text-[15px] font-semibold text-slate-900">
                                    {edit ? "Edit vehicle" : "New vehicle"}
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

                            <div className="p-6">
                                <div className="flex items-center justify-start space-x-4">
                                    <div className="relative">
                                        <label className="text-[13px] font-medium text-slate-700">Make</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="make"
                                            name="make"
                                            type="text"
                                            value={values.make}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.make && errors.make) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.make}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-start space-x-4">
                                    <div className="relative" >
                                        <label className="text-[13px] font-medium text-slate-700">Model</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="model"
                                            name="model"
                                            type="text"
                                            value={values.model}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {touched.model && errors.model ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.model}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
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
    );
};
export default MyPopUpForm;