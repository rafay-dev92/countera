import React, { useState, useRef, useEffect } from 'react';
import { useFormik } from "formik";
import * as Yup from "yup";
import { WrenchIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Button, Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { inspectionReport } from "../../data/inspection-report2";
import ReactToPrint from 'react-to-print';
import { fetchCustomers } from '@/services/fetchCustomers';
import { State } from '@/state/Context';
import { toast } from 'react-toastify';
import { addInspection } from '@/services/addInspection';
import { useConfirm } from '@/context/confirmContext';

const schema = Yup.object().shape({
    customer: Yup.string().required("Customer is required"),
    vehicle: Yup.string().required("Vehicle is required"),
    data: Yup.object().shape({
        data: Yup.array().of(
            Yup.object().shape({
                name: Yup.string(),
                detail: Yup.string(),
                status: Yup.string()
            })
        )
    })
});

export function Inspection() {
    const { state, dispatch } = State();
    const resetConfirm = useConfirm()
    const printBtnRef = useRef();
    const componentRef = useRef();
    const customerInputRef = useRef();

    const [data, setData] = useState(inspectionReport);
    const [customerInspections, setCustomerInspections] = useState([]);
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [refresh, setRefresh] = useState(false);

    const Reset = async () => {
        const confirmed = await resetConfirm("Do you want to reset the inspection page?")
        if (!confirmed) return
        clearForm(formikProps)
        setSelectedCustomer(null)
        setSelectedVehicle(null)
        setCustomerInspections([])
        setSelectedInspection(null)
        setShowCustomerSuggestions(false)
        dispatch({ type: 'SET_INSPECTION_DATA', payload: null });
    }

    const handleDel = (index) => {
        const newData = values.data.filter(item => item !== values.data[index]);
        setValues({ ...values, data: newData })
    }

    // check if redirected from customer page
    useEffect(() => {
        if (state.inspection?.selected) {
            const selected = state.inspection?.selected;
            setSelectedCustomer(selected.Customer);
            setSelectedVehicle(selected.Customer.Vehicle.find(vehicle => vehicle.id === selected.CustomerVehicleId));
            setValues({ ['customer']: selected.CustomerId, ['vehicle']: selected.CustomerVehicleId, data: JSON.parse(selected.data) });
            setShowCustomerSuggestions(false);
        }
    }, [state.inspection?.selected]);

    const currentDate = new Date().toLocaleDateString();

    const onSubmit = async (values) => {
        if (!values.customer) {
            toast.error('Select customer first')
            return
        }
        try {
            if (values.data.length === 0) {
                toast.error('Atleast select one inspection parameter')
                return
            }
            const data = {
                CustomerId: values.customer,
                CustomerVehicleId: values.vehicle,
                data: JSON.stringify(values.data)
            }
            const res = await addInspection(data, state.userToken);
            await res.json()
            toast.success("Inspection saved successfully")
            setRefresh(!refresh)
            setTimeout(() => {
                printBtnRef.current?.click();
                Reset()
            }, 100);
        } catch (error) {
            console.log(error)
            Reset()
            toast.error('Something went wrong');
        }
    };

    const getCustomers = async () => {
        const fetchedCustomers = await fetchCustomers(state.userToken);
        const customersData = await fetchedCustomers.json();
        setCustomers(customersData);
    };

    useEffect(() => {
        getCustomers();
    }, [refresh]);

    const handleCustomerChange = (customer) => {
        setSelectedCustomer(customer);
        setCustomerInspections(customer.Inspection);
        if (customer && customer.Vehicle.length > 0) {
            setSelectedVehicle(customer.Vehicle[0]);
            setValues({ ...values, ['customer']: customer.id, ['vehicle']: customer.Vehicle[0].id });
        };
        setShowCustomerSuggestions(false);
    };

    // handle vehicle change
    const handleVehicleChange = (vehicleId) => {
        const foundVehicle = selectedCustomer.Vehicle.find(
            (vehicle) => `${vehicle.id}` === vehicleId
        );
        setSelectedVehicle(foundVehicle);
        setValues({ ...values, ['vehicle']: vehicleId })
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (customerInputRef.current && !customerInputRef.current.contains(event.target)) {
                setShowCustomerSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // const openInspection = () => {
    //     if (selectedInspection) {
    //         const inspection = customerInspections.find((inspection) => inspection.id === selectedInspection);
    //         const updatedInspection = { ...inspection, Customer: selectedCustomer };
    //         dispatch({ type: 'SET_INSPECTION_DATA', payload: updatedInspection })
    //     }
    // }

    useEffect(() => {
        if (selectedInspection) {
            const inspection = customerInspections.find((inspection) => inspection.id === selectedInspection);
            if (inspection) {
                const updatedInspection = { ...inspection, Customer: selectedCustomer };
                dispatch({ type: 'SET_INSPECTION_DATA', payload: updatedInspection })
            }
        } else {
            dispatch({ type: 'SET_INSPECTION_DATA', payload: null })
        }
    }, [selectedInspection]);

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                customer: '',
                vehicle: '',
                data: inspectionReport
            },
            errors: {
                customer: '',
                vehicle: '',
                data: inspectionReport
            },
        });
        setSelectedCustomer(null);
    };

    const formikProps = useFormik({
        initialValues: {
            customer: '',
            vehicle: '',
            data: inspectionReport
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
        setValues,
    } = formikProps;

    return (
        <div className="h-full w-full overflow-x-hidden">
            <div className="rounded-none">
                <div className="mb-4 sm:mb-0 flex items-center">
                    <Typography variant="h5" color="blue-gray" className="flex items-center">
                        <WrenchIcon className="h-12 w-12 text-blueGray-500 ml-2" />
                        Inspection
                    </Typography>
                </div>
            </div>
            <div className="p-4 px-0">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col lg:flex-row items-center mx-5">
                        <div className="w-full flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-3 lg:gap-1">
                            <Button className="w-full lg:w-auto bg-green-600 py-2.5" size="md" onClick={Reset} >
                                Reset
                            </Button>

                            <div className="relative mb-5 w-full lg:w-auto" ref={customerInputRef}>
                                <div className="flex items-center pl-3 mb-1">
                                    <label className="font-bold text-sm lg:text-base">Customer</label>
                                </div>
                                <input
                                    className="w-full lg:w-auto h-full mx-0 lg:mx-2 p-2 border border-gray-700/20 rounded-md text-gray-700 font-small placeholder-gray-700"
                                    id="customer"
                                    name="customer"
                                    type="text"
                                    value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : values.customer}
                                    onClick={() => { setShowCustomerSuggestions(true); setValues({ ...values, ['customer']: '' }) }}
                                    onChange={(e) => { setSelectedCustomer(null); setSelectedVehicle(null); handleChange(e) }}
                                    onBlur={handleBlur}
                                    autoComplete="off"
                                    placeholder="Select Customer"
                                />
                                {/* {touched.customer && errors.customer ? (
                                <div className="text-red-500">
                                    {errors.customer}
                                </div>
                                ) : (<div></div>)} */}
                                {showCustomerSuggestions && (
                                    <ul className="d-block absolute z-50 bg-white border border-slate-700 w-full top-full mt-1 overflow-y-auto min-h-24 max-h-48 ">
                                        {customers.length > 0 ?
                                            customers
                                                .filter(customer => {
                                                    const searchTerm = values.customer.trim().toLowerCase();
                                                    return (
                                                        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm) ||
                                                        customer.phone?.toLowerCase().includes(searchTerm)
                                                    );
                                                })
                                                .map(customer => (
                                                    <li
                                                        key={customer.id}
                                                        className="cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-200"
                                                        onClick={() => handleCustomerChange(customer)}
                                                    >
                                                        {customer.firstName} {customer.lastName}
                                                    </li>
                                                ))
                                            :
                                            <li className="px-2 py-1 rounded-sm">No Customer</li>
                                        }
                                    </ul>
                                )}
                            </div>

                            <div className='relative mb-5 w-full lg:w-auto'>
                                <div className="flex items-center pl-3 mb-1">
                                    <label className="font-bold text-sm lg:text-base">Vehicle</label>
                                </div>
                                <select
                                    id="vehicle"
                                    name="vehicle"
                                    className="w-full lg:w-auto mx-0 lg:mx-2 p-2 border border-gray-300 bg-inherit rounded-md"
                                    value={values.vehicle}
                                    onChange={(e) =>
                                        handleVehicleChange(e.target.value)
                                    }
                                    onBlur={handleBlur}
                                >
                                    {selectedCustomer && selectedCustomer.Vehicle?.length > 0 ? selectedCustomer.Vehicle?.map((vehicle) => (
                                        <option
                                            key={vehicle.id}
                                            value={vehicle.id}
                                        >
                                            {vehicle.make} {vehicle.model} {vehicle.year}
                                        </option>
                                    ))
                                        :
                                        <option value="">Select Vehicle</option>
                                    }
                                </select>
                            </div>
                            {/* {customerInspections?.length > 0 && ( */}
                                <div className="flex flex-col mb-5 mx-0 lg:mx-2 w-full lg:w-auto">
                                    <span className="font-bold text-sm lg:text-base mb-1">Inspections History</span>
                                    <div className='flex items-center gap-2 w-full'>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                                            onChange={(e) => setSelectedInspection(e.target.value)}
                                        >
                                            <option value="">Select an Inspection</option>
                                            {customerInspections?.map((inspection) => {
                                                const matchedVehicle = selectedCustomer?.Vehicle.find(
                                                    (vehicle) => vehicle.id === inspection.CustomerVehicleId
                                                );

                                                return (
                                                    <option key={inspection.id} value={inspection.id}>
                                                        {`${inspection.createdAt.split('T')[0]} (${matchedVehicle ? matchedVehicle.make + " " + matchedVehicle.model : "Unknown Vehicle"})`}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {/* {selectedInspection && (
                                            <Button onClick={openInspection} className='bg-teal-700 w-fit ms-auto'>Open</Button>
                                        )} */}
                                    </div>
                                </div>
                            {/* )} */}
                        </div>
                    </div>
                    <div className="overflow-auto">
                        <div ref={componentRef} >
                            <div className="hidden print:block p-4">
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <img src={state.business.logo} alt="Logo" className="h-10 w-10 rounded-md" />
                                        <h1 className="text-xl font-semibold">{state.business.name}</h1>
                                    </div>
                                    <p className="text-sm font-medium">
                                        Inspection Date: {state.inspection?.selected
                                            ? new Date(state.inspection.selected.createdAt).toLocaleDateString()
                                            : currentDate}
                                    </p>
                                </div>

                                <div className='flex items-center justify-between mt-2 bg-gray-100 py-4 px-1'>
                                    <h4 className='text-xl font-semibold'>Inspection Report</h4>
                                    <div className='flex flex-col '>
                                        <p className="text-sm font-medium">Customer: {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''}</p>
                                        <p className="text-sm font-medium">Vehicle: {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.year}` : ''}</p>
                                    </div>
                                </div>
                            </div>
                            <table className="w-full bg-white border border-gray-200">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left px-4 py-2 text-xs">Name</th>
                                        <th className="text-left px-4 py-2 text-xs">Good</th>
                                        <th className="text-left px-4 py-2 text-xs">Fair</th>
                                        <th className="text-left px-4 py-2 text-xs">Poor</th>
                                        <th className="text-left px-4 py-2 text-xs">Details</th>
                                        <th className="text-left px-4 py-2 text-xs print:hidden">Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {values?.data?.map((item, idx) => (
                                        <tr id='table' key={idx} className={`w-full border-b border-gray-200 px-4 py-1 text-xs ${item.category ? 'bg-gradient-to-br from-gray-800 to-gray-700 text-white py-2' : ''}`}>
                                            <td className="border-b border-gray-200 px-4 py-1">{item.name}</td>
                                            {!item.category ?
                                                <td className="border-b border-gray-200 px-4 py-1">
                                                    <span>{values.data[idx].good}</span>
                                                    <div onClick={() => setFieldValue(`data[${idx}].status`, 'good')} className={`h-6 w-6 rounded-full cursor-pointer ${values.data[idx].status === 'good' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                </td> : <td></td>}
                                            {!item.category ?
                                                <td className="border-b border-gray-200 px-4 py-1">
                                                    <div onClick={() => setFieldValue(`data[${idx}].status`, 'fair')} className={`h-6 w-6 rounded-full cursor-pointer ${values.data[idx].status === 'fair' ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                                                </td> : <td></td>}
                                            {!item.category ?
                                                <td className="border-b border-gray-200 px-4 py-1">
                                                    <div onClick={() => setFieldValue(`data[${idx}].status`, 'poor')} className={`h-6 w-6 rounded-full cursor-pointer ${values.data[idx].status === 'poor' ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                                </td> : <td></td>}
                                            {!item.category ?
                                                <td className="border-b border-gray-200 px-4 py-1 print:hidden">
                                                    <input
                                                        id='inputField'
                                                        variant="static"
                                                        type="text"
                                                        placeholder="Enter details..."
                                                        className="px-2 py-1 w-full focus:outline-none focus:border-blue-500 text-xs min-w-[100px]"                                                    
                                                        value={values.data[idx].detail}
                                                        onChange={e => setFieldValue(`data[${idx}].detail`, e.target.value)}
                                                    />
                                                </td> : <td></td>}
                                            <td className="hidden print:inline min-w-[100px] text-sm text-gray-900 my-auto"><span>{item.detail}</span></td>
                                            {!item.category ?
                                                <td className="border-b border-gray-200 px-4 py-2 print:hidden">
                                                    <TrashIcon id='delButton' onClick={() => handleDel(idx)} className='h-4 w-4 text-red-500 cursor-pointer' />
                                                </td> : <td></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-xs print:flex w-full m-2 mt-12 hidden">
                                <span className="whitespace-nowrap">SignX</span>
                                <div className=" border-t border-gray-500 mt-3 ms-2 w-48 mr-2">
                                </div>
                                <span>Date</span>
                                <div className=" border-t border-gray-500 mt-3 ms-2 w-48">
                                </div>
                            </div>
                        </div>
                        <div className="flex lg:justify-end justify-start gap-3 m-4">
                            {!state.inspection?.selected && (
                                <Button onClick={() => onSubmit(values)} type='submit' className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded">
                                    Submit & Print
                                </Button>
                            )}
                            <ReactToPrint
                                trigger={() => <Button ref={printBtnRef} className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded">Print</Button>}
                                content={() => componentRef.current}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Inspection;
