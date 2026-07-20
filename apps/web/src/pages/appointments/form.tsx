import React, { useEffect, useState } from "react";
import { Dialog } from "@material-tailwind/react";
import { addAppointment } from "@/services/addAppointment";
import { updateAppointment } from "@/services/updateAppointment";
import { useFormik } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { Appointment } from "@/types/api";

const schema = Yup.object().shape({
    customerName: Yup.string().required("Name is required"),
    customerEmail: Yup.string().email('Invalid email').required("Email is required"),
    description: Yup.string(),
    startDateTime: Yup.date().required("Start date is required"),
    // endDateTime: Yup.string().required("End Time is required"),
    sendEmail: Yup.boolean()
});

interface AppointmentFormValues {
    customerName: string;
    description: string;
    customerEmail: string;
    startDateTime: string;
    BusinessId: string;
    sendEmail: boolean;
}

interface AppointmentFormProps {
    selectedItem: Appointment | null;
    setSelectedItem: React.Dispatch<React.SetStateAction<Appointment | null>>;
    open: boolean;
    close: () => void;
    refresh: boolean;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

function AppointmentForm({ selectedItem, setSelectedItem, open, close, refresh, setRefresh }: AppointmentFormProps) {

    const { state } = State();
    const [currentDate, setCurrentDate] = useState(getCurrentDateTimeForInput());
    const [edit, setEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = () => {
        clearForm(formikProps);
        setEdit(false);
        setSelectedItem(null);
        close();
    };

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

    useEffect(() => {
        if (selectedItem) {
            setEdit(true);
            formikProps.setValues({
                customerName: selectedItem.customerName,
                customerEmail: selectedItem.customerEmail,
                description: selectedItem.description,
                startDateTime: correctDateFormat(selectedItem.startDateTime),
                endDateTime: correctTimeFormat(selectedItem.endDateTime),
                sendEmail: selectedItem.sendEmail,
            } as any);
        }
    }, [selectedItem])

    const correctDateFormat = (date: string) => {
        const parsedDate = new Date(date);
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        const hours = String(parsedDate.getHours()).padStart(2, '0');
        const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
        const seconds = String(parsedDate.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    const correctTimeFormat = (date: string) => {
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

    function getCurrentDateTimeForInput() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const onSubmit = async (values: AppointmentFormValues) => {
        setIsLoading(true);
        const inputDateTime = new Date(values.startDateTime); // assumes ISO format string
        const inputDate = inputDateTime.toLocaleDateString('en-CA'); // format to YYYY-MM-DD;
        const inputStartTime =
            inputDateTime.getHours() * 60 + inputDateTime.getMinutes();

        // Add 30 minutes to start time for end time
        const endDateTimeObj = new Date(inputDateTime.getTime() + 30 * 60000); // 60000 ms = 1 minute
        const inputEndTime =
            endDateTimeObj.getHours() * 60 + endDateTimeObj.getMinutes();

        const inputEndDateTime = endDateTimeObj.toISOString(); // final endDateTime in full ISO format

        // Optional: Get current date/time for comparison
        const currDateTime = new Date(currentDate);
        const currDate = currDateTime.toISOString().split('T')[0];
        const currentTime =
            currDateTime.getHours() * 60 + currDateTime.getMinutes();

        // Final updated values to send
        const updatedValues = {
            ...values,
            endDateTime: inputEndDateTime,
            BusinessId: state.business!.id,
            BusinessName: state.business!.name,
            BusinessEmail: state.business!.email,
        };

        // if (inputStartTime >= inputEndTime) {
        //     showToastMessage('error', 'Start time must be before end time')
        //     setError(true);
        //     setErrorFalse();
        //     setIsLoading(false);
        //     close();
        //     return;
        // }

        if (inputStartTime <= currentTime && inputDate === currDate) {
            showToastMessage('error', 'Start time must be ahead of current time')
            setIsLoading(false);
            close();
            return;
        }

        else {
            try {
                if (!edit) {
                    const res = (await addAppointment(updatedValues, state.userToken))!;
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
                    const res = (await updateAppointment(selectedItem!.id, updatedValues, state.userToken))!;
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

    const clearForm = (formikProps: FormikProps<AppointmentFormValues>) => {
        formikProps.resetForm({
            values: {
                customerName: '',
                description: '',
                customerEmail: '',
                startDateTime: '',
                // endDateTime: '',
                BusinessId: '',
                sendEmail: true,
            },
            errors: {
                customerName: '',
                description: '',
                customerEmail: '',
                startDateTime: '',
                // endDateTime: '',
                BusinessId: '',
                sendEmail: true,
            } as any,
        });
    };

    const formikProps = useFormik<AppointmentFormValues>({
        initialValues: {
            customerName: '',
            description: '',
            customerEmail: '',
            startDateTime: '',
            // endDateTime: '',
            BusinessId: '',
            sendEmail: true,
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

    return (
        <>
            <Dialog className="bg-transparent shadow-none p-0" open={open} handler={undefined as any} >
                {open && (
                    <form onSubmit={handleSubmit} autoComplete="new" >
                        <div className="fixed -top-16 lg:top-0 left-0 w-full h-full flex justify-center items-center">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className="text-[15px] font-semibold text-slate-900" >
                                        {edit ? "Edit appointment" : "New appointment"}
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

                                <div className="2xl:w-[50vw] xl:w-[60vw] lg:w-[70vw] md:w-[80vw] w-[90vw] p-6 space-y-3 max-h-[70vh] lg:max-h-[80vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[13px] font-medium text-slate-700">Customer Name</label>
                                                <input
                                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                    id="customerName"
                                                    name="customerName"
                                                    type="customerName"
                                                    value={values.customerName}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                />
                                                {touched.customerName && errors.customerName && (
                                                    <div className="mt-1 text-xs text-red-600">
                                                        {errors.customerName}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[13px] font-medium text-slate-700">Customer Email</label>
                                                <input
                                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                    id="customerEmail"
                                                    name="customerEmail"
                                                    type="customerEmail"
                                                    value={values.customerEmail}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                />
                                                {touched.customerEmail && errors.customerEmail && (
                                                    <div className="mt-1 text-xs text-red-600">
                                                        {errors.customerEmail}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[13px] font-medium text-slate-700">Start Date & Time</label>
                                                <DatePicker
                                                    id="startDateTime"
                                                    name="startDateTime"
                                                    selected={values.startDateTime ? new Date(values.startDateTime) : null}
                                                    onChange={(date) => setFieldValue("startDateTime", date)}
                                                    onBlur={handleBlur}
                                                    showTimeSelect
                                                    timeFormat="HH:mm"
                                                    timeIntervals={15}
                                                    dateFormat="yyyy-MM-dd HH:mm"
                                                    minDate={new Date()}
                                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                />
                                                {(touched.startDateTime && errors.startDateTime) ? (
                                                    <div className="mt-1 text-xs text-red-600">
                                                        {errors.startDateTime}
                                                    </div>
                                                ) : (<div></div>)}
                                            </div>
                                        </div>

                                        {/* <div className="flex items-center justify-start space-x-4 w-full">
                                        <div className="basis-[50%]">
                                            <label className="text-[13px] font-medium text-slate-700">Start Date & Time</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="startDateTime"
                                                name="startDateTime"
                                                type="datetime-local"
                                                min={currentDate}
                                                value={values.startDateTime}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {(touched.startDateTime && errors.startDateTime) ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.startDateTime}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="basis-[50%]">
                                            <label className="text-[13px] font-medium text-slate-700">End Time</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="endDateTime"
                                                name="endDateTime"
                                                type="time"
                                                value={values.endDateTime}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.endDateTime && errors.endDateTime ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.endDateTime}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                    </div> */}

                                        <div>
                                            <label className="text-[13px] font-medium text-slate-700">Description</label> <br />
                                            <textarea
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="description"
                                                name="description"
                                                {...({ type: "description" } as any)}
                                                value={values.description}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.description && errors.description && (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.description}
                                                </div>
                                            )}
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
        </>
    );
}

export default AppointmentForm;