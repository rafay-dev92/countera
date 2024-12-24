import React, { useEffect, useState } from "react";
import { Dialog } from "@material-tailwind/react";
import { addAppointment } from "@/services/addAppointment";
import { updateAppointment } from "@/services/updateAppointment";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";

const schema = Yup.object().shape({
    customerName: Yup.string().required("Name is required"),
    customerEmail: Yup.string().email('Invalid email').required("Email is required"),
    description: Yup.string(),
    startDateTime: Yup.date().required("Start date is required"),
    endDateTime: Yup.string().required("End Time is required"),
    BusinessId: Yup.string().required("Business in required"),
    sendEmail: Yup.boolean()
});

function AppointmentForm({ selectedItem, setSelectedItem, open, close, refresh, setRefresh }) {

    const { state } = State();
    const [currentDate, setCurrentDate] = useState(getCurrentDateTimeForInput());
    const [edit, setEdit] = useState(false);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = () => {
        clearForm(formikProps);
        setEdit(false);
        setSelectedItem(null);
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

    useEffect(() => {
        if (selectedItem) {
            setEdit(true);
            formikProps.setValues({
                customerName: selectedItem.customerName,
                description: selectedItem.description,
                startDateTime: correctDateFormat(selectedItem.startDateTime),
                endDateTime: correctTimeFormat(selectedItem.endDateTime),
                BusinessId: selectedItem.BusinessId,
                sendEmail: selectedItem.sendEmail,
            });
        }
    }, [selectedItem])

    const correctDateFormat = (date) => {
        const parsedDate = new Date(date);
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        const hours = String(parsedDate.getHours()).padStart(2, '0');
        const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
        const seconds = String(parsedDate.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    const correctTimeFormat = (date) => {
        const parsedDate = new Date(date);
        const hours = String(parsedDate.getHours()).padStart(2, '0');
        const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
        const seconds = String(parsedDate.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }

    useEffect(() => {
        let currentDate = new Date();
        setInterval(() => {
            const now = new Date();
            if (now.getMinutes() !== currentDate.getMinutes()) {
                setCurrentDate(getCurrentDateTimeForInput);
            }
        }, 1000)
    }, []);

    useEffect(() => {
    }, [error])

    const setErrorFalse = () => {
        setTimeout(() => {
            setError(false)
        }, 5000)
    }

    function getCurrentDateTimeForInput() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const onSubmit = async (values) => {
        setIsLoading(true);
        const inputDate = values.startDateTime.split('T')[0];
        const inputStartTime = (parseInt(values.startDateTime.split('T')[1].split(':')[0], 10) * 60) + parseInt(values.startDateTime.split('T')[1].split(':')[1], 10);
        const inputEndTime = (parseInt(values.endDateTime.split(':')[0], 10) * 60) + parseInt(values.endDateTime.split(':')[1], 10);
        const currDate = currentDate.split('T')[0];
        const currentTime = (parseInt(currentDate.split('T')[1].split(':')[0], 10) * 60) + parseInt(currentDate.split('T')[1].split(':')[1], 10);

        const inputEndDateTime = `${inputDate}T${values.endDateTime}`.trim();
        const updatedValues = { ...values, endDateTime: inputEndDateTime, BusinessId: state.business.id, BusinessEmail: state.business.email };

        if (inputStartTime >= inputEndTime) {
            showToastMessage('error', 'Start time must be before end time')
            setError(true);
            setErrorFalse();
            setIsLoading(false);
            return;
        }

        else if (inputStartTime <= currentTime && inputDate === currDate) {
            showToastMessage('error', 'Start time must be ahead of current time')
            setError(true);
            setErrorFalse();
            setIsLoading(false);
            return;
        }

        else if (inputEndTime <= currentTime && inputDate === currDate) {
            showToastMessage('error', 'End time must be ahead of current time')
            setError(true);
            setErrorFalse();
            setIsLoading(false);
            return;
        }

        else {
            try {
                if (!edit) {
                    const res = await addAppointment(updatedValues, state.userToken);
                    const appointment = await res.json();
                    if (res.status === 200) {
                        showToastMessage('success', appointment.message)
                    }
                    else if (res.status === 400) {
                        showToastMessage('info', appointment.message)
                    }
                    else if (res.status === 409) {
                        showToastMessage('error', appointment.message)
                    }
                    else if (res.status === 500) {
                        showToastMessage('error', "Something went wrong")
                    }
                }
                else {
                    const res = await updateAppointment(selectedItem.id, updatedValues, state.userToken);
                    const appointment = await res.json();
                    
                    if (res.status === 200) {
                        showToastMessage('success', appointment.message)
                    }
                    else if (res.status === 404) {
                        showToastMessage('info', appointment.message)
                    }
                    else if (res.status === 409) {
                        showToastMessage('error', appointment.message)
                    }
                    else if (res.status === 500) {
                        showToastMessage('error', "Something went wrong")
                    }
                }
                setRefresh(!refresh);
                setIsLoading(false);
                handleClose();
            } catch (error) {
                console.log(error)
                setIsLoading(false);
                showToastMessage('error', 'Something went wrong');
                handleClose();
            }
        }
    };

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                customerName: '',
                description: '',
                customerEmail: '',
                startDateTime: '',
                endDateTime: '',
                BusinessId: '',
                sendEmail: false,
            },
            errors: {
                customerName: '',
                description: '',
                customerEmail: '',
                startDateTime: '',
                endDateTime: '',
                BusinessId: '',
                sendEmail: false,
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            customerName: '',
            description: '',
            customerEmail: '',
            startDateTime: '',
            endDateTime: '',
            BusinessId: '',
            sendEmail: false,
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
        <>
            <Dialog size="sm" open={open}>
                {open && (
                    <form autoComplete="new" >
                        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center">
                            <div className="bg-white rounded shadow-xl">
                                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <div></div>
                                    <div className={error ? 'text-red-500 text-center text-lg' : 'text-white text-center text-lg'} >
                                        {edit ? "EDIT APPOINTMENT" : "NEW APPOINTMENT"}
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

                                <div className="p-6">
                                    <div className="flex items-center justify-start space-x-4">
                                        <div>
                                            <label className="font-bold">Customer Name</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="customerName"
                                                name="customerName"
                                                type="customerName"
                                                value={values.customerName}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.customerName && errors.customerName && (
                                                <div className="text-red-500">
                                                    {errors.customerName}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="font-bold">Customer Email</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="customerEmail"
                                                name="customerEmail"
                                                type="customerEmail"
                                                value={values.customerEmail}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.customerEmail && errors.customerEmail && (
                                                <div className="text-red-500">
                                                    {errors.customerEmail}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-start space-x-4">
                                        <div>
                                            <label className="font-bold">Start Date & Time</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="startDateTime"
                                                name="startDateTime"
                                                type="datetime-local"
                                                min={currentDate}
                                                value={values.startDateTime}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {(touched.startDateTime && errors.startDateTime) ? (
                                                <div className="text-red-500">
                                                    {errors.startDateTime}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div>
                                            <label className="font-bold">End Time</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="endDateTime"
                                                name="endDateTime"
                                                type="time"
                                                value={values.endDateTime}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.endDateTime && errors.endDateTime ? (
                                                <div className="text-red-500">
                                                    {errors.endDateTime}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="font-bold">Description</label> <br />
                                        <textarea
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="description"
                                            name="description"
                                            type="description"
                                            value={values.description}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {touched.description && errors.description && (
                                            <div className="text-red-500">
                                                {errors.description}
                                            </div>
                                        )}
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
                                        {!isLoading? 
                                            <span>{edit ? "Update" : "Save" }</span> : 
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

export default AppointmentForm;