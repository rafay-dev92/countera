import React, { useEffect, useState } from 'react';
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@material-tailwind/react";
import { State } from '@/state/Context';
import { updateQuotation } from '@/services/updateQuotation';

const schema = Yup.object().shape({   
    notes: Yup.string(),
});

interface NotesFormValues {
    notes: string;
}

interface NotesFormProps {
    open: boolean;
    close: () => void;
    quotationId: string;
    setQuotationData: React.Dispatch<React.SetStateAction<any>>;
    currentValue: string | null;
}

const NotesForm = ({ open, close, quotationId, setQuotationData, currentValue }: NotesFormProps) => {
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (values: NotesFormValues) => {
        setIsLoading(true);
        try {
            const data = {
                quotationData: {
                    notes: values.notes,
                }
            }
            const res = (await updateQuotation(quotationId, data, state.userToken))!;
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

    const clearForm = (formikProps: ReturnType<typeof useFormik<NotesFormValues>>) => {
        formikProps.resetForm({
            values: {
                notes: "",
            },
            errors: {
                notes: "",
            },
        });
    };

    const formikProps = useFormik<NotesFormValues>({
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
            <Dialog size='xs' open={open} {...({} as any)}>
                {open && (
                    <form onSubmit={handleSubmit} autoComplete="new" >
                        <div className="flex justify-center w-full">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] 2xl:w-[50vw]">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className="text-[15px] font-semibold text-slate-900">
                                        {currentValue ? "Edit notes" : "New notes"}
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
                                    <div className="w-full">
                                        <label className="text-[13px] font-medium text-slate-700">Notes</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="notes"
                                            name="notes"
                                            type="text"
                                            value={values.notes}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />                                        
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
                                            <span>{currentValue ? "Update" : "Save"}</span> :
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
export default NotesForm;