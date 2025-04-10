import React, { useState, useRef, useEffect } from 'react';
import { useFormik } from "formik";
import * as Yup from "yup";
import { WrenchIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Button, Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { inspectionReport } from "../../data/inspection-report";
import ReactToPrint from 'react-to-print';
import { fetchCustomers } from '@/services/fetchCustomers';
import { State } from '@/state/Context';

const schema = Yup.object().shape({
    customer: Yup.string().required("Customer is required"),
    vehicle: Yup.string().required("Vehicle is required"),
});

export function Inspection() {
    const { state } = State();
    const componentRef = useRef();
    const customerInputRef = useRef();

    const [data, setData] = useState(inspectionReport);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const handleStatusInputs = (index, fieldName, newValue) => {

        setData(prevData => {
            const newData = prevData.map((item, idx) => {
                if (idx === index) {
                    return {
                        ...item,
                        good: false,
                        fair: false,
                        poor: false,
                        [fieldName]: newValue,
                    };
                }
                return item;
            });
            return newData;
        });
    }

    const Reset = () => {
        setData(inspectionReport)
        clearForm(formikProps)
        setSelectedCustomer(null)
        setSelectedVehicle(null)
    }

    const handleDetailInput = (index, fieldName, newValue) => {
        const newData = [...data];
        newData[index][fieldName] = newValue;
        setData(newData);
    }

    const handleDel = (index) => {
        const newData = data.filter(item => item !== data[index]);
        setData(newData);
    }

    const currentDate = new Date().toLocaleDateString();

    const onSubmit = async (values) => {
        try {

        } catch (error) {
            console.log(error)
            showToastMessage('error', 'Something went wrong');
        }
    };

    const getCustomers = async () => {
        const fetchedCustomers = await fetchCustomers(state.userToken);
        const customersData = await fetchedCustomers.json();
        setCustomers(customersData);
    };

    useEffect(() => {
        getCustomers();
    }
        , []);

    const handleCustomerChange = (customer) => {
        setSelectedCustomer(customer);
        if (customer && customer.Vehicle.length > 0) {
            setSelectedVehicle(customer.Vehicle[0]);
            setValues({ ['customer']: customer.id });
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

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                customer: '',
                vehicle: '',
            },
            errors: {
                customer: '',
                vehicle: '',
            },
        });
        setSelectedCustomer(null);
    };

    const formikProps = useFormik({
        initialValues: {
            customer: '',
            vehicle: '',
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
        setValues,
    } = formikProps;

    return (
        <Card className="h-full w-full ">
            <CardHeader floated={false} shadow={false} className="rounded-none">
                <div className="mb-4 sm:mb-0 flex items-center">
                    <Typography variant="h5" color="blue-gray" className="flex items-center">
                        <WrenchIcon className="h-12 w-12 text-blueGray-500 ml-2" />
                        Inspection
                    </Typography>
                </div>

            </CardHeader>
            <CardBody className="p-4 px-0">
                <div className="flex flex-col lg:flex-row items-center w-full mx-5">
                    <div className="w-full lg:w-2/5 flex items-center justify-center lg:justify-start gap-1">
                        <Button className="w-full bg-green-600 lg:w-auto" size="md" onClick={Reset} >
                            Reset
                        </Button>

                        <div className="relative" ref={customerInputRef}>
                            {/* <div className="flex items-center pl-2">
                                <label className="font-bold">Customer</label>
                            </div> */}
                            <input
                                className="h-full m-2 p-2 border border-gray-700/20 rounded-md text-gray-700 font-small placeholder-gray-700"
                                id="customer"
                                name="customer"
                                type="text"
                                value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : values.customer}
                                onClick={() => { setShowCustomerSuggestions(true); setValues({ ...values, ['customer']: '' }) }}
                                onChange={(e) => { setSelectedCustomer(null); setSelectedVehicle(null); setVehicleOdometer(''), handleChange(e) }}
                                onBlur={handleBlur}
                                autoComplete="off"
                                placeholder="Select Customer"
                            />
                            {showCustomerSuggestions && (
                                <ul className="d-block absolute z-50 bg-white border border-slate-700 w-full top-full mt-1 overflow-y-auto min-h-24 max-h-48 ">
                                    {customers.length > 0 ?
                                        customers.filter(customer => `${customer.firstName.toLowerCase()} ${customer.lastName.toLowerCase()}`.includes(values.customer.trim().toLowerCase())).map((customer) => (
                                            <li key={customer.id} className="cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-200" onClick={() => { handleCustomerChange(customer) }}>
                                                {customer.firstName} {customer.lastName}
                                            </li>
                                        ))
                                        :
                                        <li className="px-2 py-1 rounded-sm">No Customer</li>
                                    }
                                </ul>
                            )}
                        </div>

                        <div>
                            {/* <div className="flex items-center pl-2">
                                <label className="font-bold">Vehicle</label>
                            </div> */}
                            <select
                                id="vehicle"
                                name="vehicle"
                                className="m-2 p-2 border border-gray-300 bg-inherit rounded-md"
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
                    </div>
                </div>
                <div className="overflow-auto">
                    <div ref={componentRef} >
                        <div className="hidden print:flex items-center justify-between p-4">
                            <h1 className="text-2xl font-bold">Sales4x</h1>
                            <p className="text-sm">Inspection Date: {currentDate}</p>
                        </div>
                        <table className="w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left px-4 py-2">Name</th>
                                    <th className="text-left px-4 py-2">Good</th>
                                    <th className="text-left px-4 py-2">Fair</th>
                                    <th className="text-left px-4 py-2">Poor</th>
                                    <th className="text-left px-4 py-2">Details</th>
                                    <th className="text-left px-4 py-2 print:hidden">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, idx) => (
                                    <tr id='table' key={idx} className={`w-full border-b border-gray-200 px-4 py-2 ${item.category ? 'bg-gradient-to-br from-gray-800 to-gray-700 text-white' : ''}`}>
                                        <td className="border-b border-gray-200 px-4 py-2">{item.name}</td>
                                        {!item.category ?
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <div onClick={() => handleStatusInputs(idx, 'good', !item.good)} className={`h-8 w-8 rounded-full cursor-pointer ${item.good ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                            </td> : <td></td>}
                                        {!item.category ?
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <div onClick={() => handleStatusInputs(idx, 'fair', !item.fair)} className={`h-8 w-8 rounded-full cursor-pointer ${item.fair ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                                            </td> : <td></td>}
                                        {!item.category ?
                                            <td className="border-b border-gray-200 px-4 py-2">
                                                <div onClick={() => handleStatusInputs(idx, 'poor', !item.poor)} className={`h-8 w-8 rounded-full cursor-pointer ${item.poor ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                            </td> : <td></td>}
                                        {!item.category ?
                                            <td className="border-b border-gray-200 px-4 py-2 print:hidden">
                                                <input
                                                    id='inputField'
                                                    variant="static"
                                                    type="text"
                                                    placeholder="Enter details..."
                                                    className="px-2 py-1 w-full focus:outline-none focus:border-blue-500"
                                                    value={item.detail}
                                                    onChange={(e) => handleDetailInput(idx, 'detail', e.target.value)}
                                                />
                                            </td> : <td></td>}
                                        <td className="hidden print:inline text-sm text-gray-900 my-auto"><span>{item.detail}</span></td>
                                        {!item.category ?
                                            <td className="border-b border-gray-200 px-4 py-2 print:hidden">
                                                <TrashIcon id='delButton' onClick={() => handleDel(idx)} className='h-6 w-6 text-red-500 cursor-pointer' />
                                            </td> : <td></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end m-4">
                        <ReactToPrint
                            trigger={() => <Button className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded">Print</Button>}
                            content={() => componentRef.current}
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default Inspection;
