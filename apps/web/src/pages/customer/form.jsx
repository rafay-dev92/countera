import React, { useState } from "react";
import { useEffect } from "react";
import { setIn, useFormik } from "formik";
import * as Yup from "yup";
import { Button, Dialog } from "@material-tailwind/react";
import { addCustomer } from "@/services/addCustomer";
import { updateCustomer } from "@/services/updateCustomer";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import { addAddress } from "@/services/addAddress";
import { updateAddress } from "@/services/updateAddress";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import CustomerVehicleForm from "./customerVehicleForm";
import { fetchCustomer } from "@/services/fetchCustomer";
import { TrashIcon } from "@heroicons/react/24/solid";
import { delCustomerVehicle } from "@/services/delCustomerVehicle";
import { useConfirm } from "@/context/confirmContext";
import { useNavigate } from "react-router-dom";


const addressSchema = Yup.object().shape({
  street: Yup.string().required("street is required"),
  city: Yup.string().required("city is required"),
  state: Yup.string().required("state is required"),
  zipcode: Yup.string().required("zip code is required"),
});

const schema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  customerType: Yup.string().default('personal').required("Customer type is required"),
  phone: Yup.string().required("Mobile number is required"),
  licenseNo: Yup.string(),
  email: Yup.string().email("Please add a valid email"),
  Address: addressSchema,
  notes: Yup.string(),
  taxable: Yup.boolean(true),
});

const MyPopUpForm = ({ open, close, selectedItem, setSelectedItem, refresh, setRefresh }) => {
  const router = useNavigate();
  const { state, dispatch } = State();
  const confirm = useConfirm();
  const [isLoading, setIsLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);
  // for customer form
  const [isOpen, setIsOpen] = useState(false);

  const openPopup = () => {
    if (state.userInfo.Permission.some(obj => obj.name === "IS_CASHIER" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN"))
      setIsOpen(true);
    else
      toast.error("You are not allowed to add a customer")
  };

  const closePopup = () => {
    setIsOpen(false);
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

  const handleClose = () => {
    clearForm(formikProps);
    setEdit(false);
    setSelectedItem(null);
    close();
  };

  useEffect(() => {
    if (selectedItem) {
      setInspections(selectedItem.Inspection);
      formikProps.setValues(selectedItem);
      setEdit(true);
    }
  }, [selectedItem]);

  const getCustomerDetails = async () => {
    try {
      const customer = await (await fetchCustomer(selectedItem.id, state.userToken)).json();
      setSelectedItem(customer);
    } catch (error) {
      console.log(error)
    }
  }

  // to clean address object
  function removeExtraAddressFields(obj) {
    const { CustomerId, id, createdAt, updatedAt, ...rest } = obj;
    return rest;
  }

  const onSubmit = async (values) => {
    setIsLoading(true);
    const updatedValues = { ...values, BusinessId: state.business.id };

    if (values.customerType === 'business' && !values.licenseNo) {
      showToastMessage('error', 'License number is required for business customer')
      setIsLoading(false);
      return;
    }

    // setting taxable to false for business customer
    if (updatedValues.customerType === 'business') updatedValues.taxable = false;
    else updatedValues.taxable = true;
    
    try {
      if (!edit) {
        // separating user data
        const { Address, ...customerData } = updatedValues

        // saving customer
        const res = await addCustomer(customerData, state.userToken);
        const customer = await res.json();
        if (res.status === 200) {
          showToastMessage('success', customer.message)

          // saving customer's address
          Address.CustomerId = customer.data.id;
          const addressRes = await addAddress(Address, state.userToken);
          const address = await addressRes.json();
          if (addressRes.status === 200) {
            showToastMessage('success', address.message)
          }
          else if (res.status === 409) {
            showToastMessage('error', address.message)
          }
        }
        else if (res.status === 409) {
          showToastMessage('error', customer.message)
        }
      }
      else {
        // separating user data
        const { Address, ...customerData } = updatedValues

        const res = await updateCustomer(selectedItem.id, customerData, state.userToken);
        const customer = await res.json();
        if (res.status === 200) {
          showToastMessage('success', customer.message)
          // checking if address updated
          const oldAddress = removeExtraAddressFields(customer.data.Address)
          const newAddress = removeExtraAddressFields(Address);
          const isAddressUpdated = Object.values(oldAddress).some(value => !Object.values(newAddress).includes(value));

          if (isAddressUpdated) {
            const addressRes = await updateAddress(customer.data.Address.id, newAddress, state.userToken);
            const address = await addressRes.json();

            if (addressRes.status === 200) {
              showToastMessage('success', address.message)
            }
            else if (addressRes.status === 404) {
              showToastMessage('info', address.message)
            }
            else if (addressRes.status === 409) {
              showToastMessage('error', address.message)
            }
          }
        }
        else if (res.status === 404) {
          showToastMessage('info', customer.message)
        }
        else if (res.status === 409) {
          showToastMessage('error', customer.message)
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

  // open inspection
  const openInspection = () => {
    if (selectedInspection) {
      const inspection = inspections.find((inspection) => inspection.id === selectedInspection);
      const updatedInspection = { ...inspection, Customer: selectedItem };
      dispatch({ type: 'SET_INSPECTION_DATA', payload: updatedInspection })
      router('/dashboard/inspection');
    }
  }

  // edit vehicle
  const handleEditVehicle = (vehicle) => {
    setCurrentVehicle(vehicle);
    openPopup();
  }

  // delete vehicle
  const deleteVehicle = async (vehicleId) => {
    const confirmDelete = await confirm("Are you sure you want to delete this vehicle?");
    if (!confirmDelete) return;
    try {
      const res = await delCustomerVehicle(vehicleId, state.userToken);
      const vehicle = await res.json();
      if (res.status === 200) {
        showToastMessage('success', vehicle.message)
        getCustomerDetails();
      }
      else if (res.status === 404) {
        showToastMessage('info', vehicle.message)
      }
      else if (res.status === 409) {
        showToastMessage('error', vehicle.message)
      }
    } catch (error) {
      console.log(error)
      showToastMessage('error', 'Something went wrong')
    }
  }

  const clearForm = (formikProps) => {
    formikProps.resetForm({
      values: {
        firstName: "",
        lastName: "",
        customerType: "personal",
        phone: "",
        licenseNo: "",
        email: "",
        Address: {
          street: "",
          city: "",
          state: "",
          zipcode: ""
        },
        notes: "",
        taxable: true,
      },
      errors: {
        firstName: "",
        lastName: "",
        customerType: "personal",
        phone: "",
        licenseNo: "",
        email: "",
        Address: {
          street: "",
          city: "",
          state: "",
          zipcode: ""
        },
        notes: "",
        taxable: true,
      },
    });
  };

  const formikProps = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      customerType: "personal",
      phone: "",
      licenseNo: "",
      email: "",
      Address: {
        street: "",
        city: "",
        state: "",
        zipcode: ""
      },
      notes: "",
      taxable: true,
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
    <>
      <Dialog open={open}>
        {open && (
          <form onSubmit={handleSubmit} autoComplete="new">
            <div className="flex justify-center w-full">
              <div className="bg-white rounded shadow-xl">
                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                  <div></div>
                  <div className="text-white text-center text-lg">
                    {edit ? "EDIT CUSTOMER" : "NEW CUSTOMER"}
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

                <div className="2xl:w-[50vw] xl:w-[60vw] lg:w-[70vw] md:w-[80vw] w-[90vw] p-6 space-y-3">
                  <div className="flex justify-around">
                    <div className="flex space-x-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          value="personal"
                          checked={values.customerType === 'personal'}
                          onChange={() => setValues({ ...values, customerType: 'personal', licenseNo: '' })}
                          className="hidden"
                        />
                        <div
                          className={`px-4 py-2 rounded-full transition-colors ${values.customerType === 'personal' ? 'bg-gradient-to-br from-gray-800 to-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                          Personal
                        </div>
                      </label>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="customerType"
                          value="business"
                          checked={values.customerType === 'business'}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div
                          className={`px-4 py-2 rounded-full transition-colors ${values.customerType === 'business' ? 'bg-gradient-to-br from-gray-800 to-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                          Business
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-start space-x-4">
                    <div className="basis-[33.33%]">
                      <label className="font-bold">First Name</label> <br />
                      <input
                        className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.firstName && errors.firstName) ? (
                        <div className="text-red-500">
                          {errors.firstName}
                        </div>
                      ) : (<div></div>)}
                    </div>
                    <div className="basis-[33.33%]">
                      <label className="font-bold">Last Name</label> <br />
                      <input
                        className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {touched.lastName && errors.lastName ? (
                        <div className="text-red-500">
                          {errors.lastName}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="basis-[33.33%]">
                      <label className="font-bold">Mobile Phone</label> <br />
                      <input
                        className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                        id="phone"
                        name="phone"
                        type="text"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.phone && errors.phone) ? (
                        <div className="text-red-500">
                          {errors.phone}
                        </div>
                      ) : (<div></div>)}
                    </div>
                  </div>

                  <div className="flex items-center justify-start space-x-4">
                    <div className="basis-[33.33%]">
                      <label className="font-bold">Email</label> <br />
                      <input
                        className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                        id="email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {touched.email && errors.email && (
                        <div className="text-red-500">
                          {errors.email}
                        </div>
                      )}
                    </div>
                    <div className="basis-[33.33%]">
                      <label className="font-bold">License No</label> <br />
                      <input
                        className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                        id="licenseNo"
                        name="licenseNo"
                        type="text"
                        value={values.licenseNo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={values.customerType !== 'business'}
                      />
                      {touched.licenseNo && errors.licenseNo && (
                        <div className="text-red-500">
                          {errors.licenseNo}
                        </div>
                      )}
                    </div>

                    <div className="basis-[33.33%]">

                    </div>
                  </div>

                  <div className="flex items-center justify-start space-x-4">
                    <div className="basis-[40%]">
                      <label className="font-bold">Street</label> <br />
                      <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                        id="Address.street"
                        name="Address.street"
                        type="text"
                        value={values?.Address?.street}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.street && errors.Address?.street) ? (
                        <div className="text-red-500">
                          {errors.Address.street}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="basis-[20%]">
                      <label className="font-bold">City</label> <br />
                      <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                        id="Address.city"
                        name="Address.city"
                        type="text"
                        value={values?.Address?.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.city && errors.Address?.city) ? (
                        <div className="text-red-500">
                          {errors.Address.city}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="basis-[20%]">
                      <label className="font-bold">State</label> <br />
                      <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                        id="Address.state"
                        name="Address.state"
                        type="text"
                        value={values?.Address?.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.state && errors.Address?.state) ? (
                        <div className="text-red-500">
                          {errors.Address.state}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="basis-[20%]">
                      <label className="font-bold">Zip Code</label> <br />
                      <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                        id="Address.zipcode"
                        name="Address.zipcode"
                        type="text"
                        value={values?.Address?.zipcode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.zipcode && errors.Address?.zipcode) ? (
                        <div className="text-red-500">
                          {errors.Address.zipcode}
                        </div>
                      ) : (<div></div>)}
                    </div>
                  </div>
                  {edit && (
                    <div className="my-4 flex flex-col w-full">
                      <div className="basis-[10%] ">
                        <div className="flex items-center">
                          <label className="p-1 font-bold">Vehicles</label>
                          <PlusCircleIcon onClick={openPopup} className="h-6 w-6 text-blue-600 cursor-pointer" />
                        </div>
                        <MyPopUpForm />
                        {/* <select
                        className="w-full p-2 border border-gray-300 bg-inherit rounded-md"
                        label="Select Vehicle"
                        animate={{
                          mount: { y: 0 },
                          unmount: { y: 25 },
                        }}
                        value={currentVehicle?.id || ""}
                        onChange={(e) => {
                          const selectedVehicle = values.Vehicle.find(
                            (vehicle) => vehicle.id === e.target.value
                          );
                          setCurrentVehicle(selectedVehicle);
                        }}
                        size="md"
                      >
                        {values.Vehicle ?
                          values.Vehicle.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              <span>{vehicle.make}, {vehicle.model}</span>                                                          
                            </option>
                          )) : []}
                      </select> */}
                      </div>
                      <div className="flex overflow-x-auto basis-[90%]">
                        {values.Vehicle && values.Vehicle.length > 0 &&
                          values.Vehicle.map((vehicle) => (
                            <div className="flex items-center gap-4 w-fit h-fit border px-2 py-1 m-1 rounded-md whitespace-nowrap">
                              <span onClick={() => handleEditVehicle(vehicle)} className="hover:underline cursor-pointer">{vehicle.make} {vehicle.model} {vehicle.year}</span>
                              <TrashIcon className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => { deleteVehicle(vehicle.id) }} />
                            </div>
                          ))
                        }
                      </div>
                      {inspections.length > 0 && (
                        <div className="flex flex-col gap-2 basis-[90%]">
                          <span className="font-bold mx-1 mt-2">Inspections</span>
                          <select
                            className="w-full px-3 py-2 border rounded"
                            onChange={(e) => setSelectedInspection(e.target.value)}
                          >
                            <option value="">Select an Inspection</option>
                            {inspections?.map((inspection) => {
                              const matchedVehicle = values.Vehicle.find(
                                (vehicle) => vehicle.id === inspection.CustomerVehicleId
                              );

                              return (
                                <option key={inspection.id} value={inspection.id}>
                                  {`${inspection.createdAt.split('T')[0]} (${matchedVehicle ? matchedVehicle.make + " " + matchedVehicle.model : "Unknown Vehicle"})`}
                                </option>
                              );
                            })}
                          </select>
                          {selectedInspection && (
                            <Button onClick={openInspection} className='bg-blue-600 w-fit ms-auto'>Open</Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="w-full">
                    <label className="font-bold">Notes</label> <br />
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                      id="notes"
                      name="notes"
                      value={values.notes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.notes && errors.notes && (
                      <div className="text-red-500">
                        {errors.notes}
                      </div>
                    )}
                  </div>
                  {values.customerType !== 'business' && (
                    <div>
                      <label className="font-bold">
                        <input
                          type="checkbox"
                          id="taxableCheckbox"
                          name="taxableCheckbox"
                          checked={values.taxable}
                          onChange={(e) => {
                            setValues((prevValues) => ({
                              ...prevValues,
                              taxable: e.target.checked
                            }));
                          }}
                        />
                        &nbsp;Taxable
                      </label>
                    </div>
                  )}
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
      {selectedItem ? <CustomerVehicleForm open={isOpen} close={closePopup} refresh={refresh} setRefresh={setRefresh} CustomerId={selectedItem?.id} getCustomerDetails={getCustomerDetails} selectedVehicle={currentVehicle} /> : null}
    </>
  );
};
export default MyPopUpForm;