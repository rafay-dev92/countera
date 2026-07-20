import React, { useState } from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@/widgets/mt";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import { addPermission } from "@/services/addPermission";
import { updatePermission } from "@/services/updatePermission";
import type { Permission } from "@/types/api";

const schema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    description: Yup.string(),
});

interface PermissionFormValues {
    name: string;
    description: string;
}

interface PermissionFormProps {
    open: boolean;
    close: () => void;
    selectedItem: Permission | null;
    setSelectedItem: React.Dispatch<React.SetStateAction<Permission | null>> | null;
    refresh: boolean;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const PermissionForm = ({ open, close, selectedItem, setSelectedItem, refresh, setRefresh }: PermissionFormProps) => {

    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);

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

    const handleClose = () => {
        clearForm(formikProps);
        setEdit(false);
        if(setSelectedItem) setSelectedItem(null);
        close();
    };

    useEffect(() => {
        if (selectedItem) {
            formikProps.setValues(selectedItem as unknown as PermissionFormValues);
            setEdit(true);
        }
    }, [selectedItem]);

    const onSubmit = async (values: PermissionFormValues) => {
        setIsLoading(true);

        try {
            if (!edit) {
                // saving user data
                const res = (await addPermission(values, state.userToken))!;
                const permission = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', permission.message)
                }
                else if (res.status === 409) {
                    showToastMessage('error', permission.message)
                }
            }
            else {
                const res = (await updatePermission(selectedItem!.id, values, state.userToken))!;
                const permission = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', permission.message)
                }
                else if (res.status === 404) {
                    showToastMessage('info', permission.message)
                }
                else if (res.status === 409) {
                    showToastMessage('error', permission.message)
                }
            }

            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        } catch (error) {
            console.log(error)
            showToastMessage('error', 'Something went wrong')
            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        }
    };

    const clearForm = (formikProps: ReturnType<typeof useFormik<PermissionFormValues>>) => {
        formikProps.resetForm({
            values: {
                name: "",
                description: "",               
            },
            errors: {
                name: "",
                description: "",    
            },
        });
    };

    const formikProps = useFormik<PermissionFormValues>({
        initialValues: {
            name: "",
            description: "",
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

    return (
        <>
            <Dialog open={open}>
                {open && (
                    <form autoComplete="new">
                        <div className="">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className="text-[15px] font-semibold text-slate-900">
                                        {edit ? "Edit permission" : "New permission"}
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

                                <div className="p-6">
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
                                            <label className="text-[13px] font-medium text-slate-700">Description</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="description"
                                                name="description"
                                                type="text"
                                                value={values.description}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.description && errors.description ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.description}
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
};
export default PermissionForm;