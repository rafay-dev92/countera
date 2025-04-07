import React, { useEffect, useState } from 'react';
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@material-tailwind/react";
import { State } from '@/state/Context';
import { updateQuotation } from '@/services/updateQuotation';

const schema = Yup.object().shape({   
    notes: Yup.string(),
});

const NotesForm = ({ open, close, quotationId, setQuotationData, currentValue }) => {
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (values) => {
        setIsLoading(true);
        if (values.notes === "") {
            return;
        }
        try {
            const data = {
                quotationData: {
                    notes: values.notes,
                }
            }
            const res = await updateQuotation(quotationId, data, state.userToken);
            const quotation = await res.json();
            if (res.status === 200) {
                setQuotationData(quotation.data);
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
                notes: "",
            },
            errors: {
                notes: "",
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            notes: "",
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
        if (currentValue !== "") {
            setFieldValue("notes", currentValue);
        }
        }
    , [currentValue]);

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
                                        {currentValue ? "EDIT" : "NEW"} {"NOTES"}
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
                                    <div className="w-full">
                                        <label className="font-bold">Notes</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="notes"
                                            name="notes"
                                            type="text"
                                            value={values.notes}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />                                        
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
                                            <span>{currentValue ? "Update" : "Save"}</span> :
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
export default NotesForm;