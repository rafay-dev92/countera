import React, { useState } from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import { addPermission } from "@/services/addPermission";
import { updatePermission } from "@/services/updatePermission";

const schema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    description: Yup.string(),
});

const PermissionForm = ({ open, close, selectedItem, setSelectedItem, refresh, setRefresh }) => {

    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);

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
        if(setSelectedItem) setSelectedItem(null);
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
                // saving user data
                const res = await addPermission(values, state.userToken);
                const permission = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', permission.message)
                }
                else if (res.status === 409) {
                    showToastMessage('error', permission.message)
                }
            }
            else {
                const res = await updatePermission(selectedItem.id, values, state.userToken);
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

    const clearForm = (formikProps) => {
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

    const formikProps = useFormik({
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
                        <div className="flex justify-center w-full">
                            <div className="bg-white rounded shadow-xl">
                                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <div></div>
                                    <div className="text-white text-center text-lg">
                                        {edit ? "EDIT PERMISSION" : "NEW PERMISSION"}
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

                                <div className="w-[50vw] p-6">
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
                                            <label className="font-bold">Description</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="description"
                                                name="description"
                                                type="text"
                                                value={values.description}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.description && errors.description ? (
                                                <div className="text-red-500">
                                                    {errors.description}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>                                    
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
};
export default PermissionForm;