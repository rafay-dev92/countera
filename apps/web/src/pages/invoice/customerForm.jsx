import React, { useState } from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@material-tailwind/react";
import { addCustomer } from "@/services/addCustomer";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import { addAddress } from "@/services/addAddress";
import { updateCustomer } from "@/services/updateCustomer";

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

const CustomerForm = ({ open, close, refresh, setRefresh, selectedCustomer, setSelectedCustomer }) => {

  const { state } = State();
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
    setSelectedCustomer(null);
    close();
  };

  function removeExtraAddressFields(obj) {
    const { CustomerId, id, createdAt, updatedAt, ...rest } = obj;
    return rest;
  }

  useEffect(() => {
    if (selectedCustomer) {
      setValues({
        firstName: selectedCustomer.firstName,
        lastName: selectedCustomer.lastName,
        customerType: selectedCustomer.customerType,
        phone: selectedCustomer.phone,
        licenseNo: selectedCustomer.licenseNo,
        email: selectedCustomer.email,
        Address: {
          street: selectedCustomer.Address.street,
          city: selectedCustomer.Address.city,
          state: selectedCustomer.Address.state,
          zipcode: selectedCustomer.Address.zipcode
        },
        notes: selectedCustomer.notes,
        taxable: selectedCustomer.taxable
      });
    }
  }, [selectedCustomer]);

  const onSubmit = async (values) => {
    setIsLoading(true);

    if (values.customerType === 'business' && !values.licenseNo) {
      showToastMessage('error', 'License number is required for business customer')
      setIsLoading(false);
      return;
    }
    const updatedValues = { ...values, BusinessId: state.business.id };

    // setting taxable to false for business customer
    if (updatedValues.customerType === 'business') updatedValues.taxable = false;

    try {
      if (selectedCustomer) {
        // separating user data
        const { Address, ...customerData } = updatedValues

        const res = await updateCustomer(selectedCustomer.id, customerData, state.userToken);
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
        setRefresh(!refresh);
        setIsLoading(false);
        handleClose();
      }
      else {

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
        console.log(customer.data)
        setSelectedCustomer(customer.data);
        setRefresh(!refresh);
        setIsLoading(false);
        handleClose();
      }
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
          <form onSubmit={handleSubmit} autoComplete="new" >
            <div className="flex justify-center w-full">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] 2xl:w-[50vw]">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                  <div className="text-[15px] font-semibold text-slate-900">
                    {selectedCustomer ? "Edit customer" : "New customer"}
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

                <div className="2xl:w-[50vw] xl:w-[60vw] lg:w-[70vw] md:w-[80vw] w-[90vw] p-6 space-y-3 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-around mb-3">
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
                          className={`px-4 py-2 rounded-full transition-colors ${values.customerType === 'personal' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60'
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
                          className={`px-4 py-2 rounded-full transition-colors ${values.customerType === 'business' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60'
                            }`}
                        >
                          Business
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col">
                      <label className="text-[13px] font-medium text-slate-700">First Name</label>
                      <input
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.firstName && errors.firstName) ? (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.firstName}
                        </div>
                      ) : (<div></div>)}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[13px] font-medium text-slate-700">Last Name</label>
                      <input
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {touched.lastName && errors.lastName ? (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.lastName}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[13px] font-medium text-slate-700">Mobile Phone</label>
                      <input
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="phone"
                        name="phone"
                        type="text"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.phone && errors.phone) ? (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.phone}
                        </div>
                      ) : (<div></div>)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col">
                      <label className="text-[13px] font-medium text-slate-700">Email</label>
                      <input
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {touched.email && errors.email && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.email}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[13px] font-medium text-slate-700">License No</label>
                      <input
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="licenseNo"
                        name="licenseNo"
                        type="text"
                        value={values.licenseNo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={values.customerType !== 'business'}
                      />
                      {touched.licenseNo && errors.licenseNo && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.licenseNo}
                        </div>
                      )}
                    </div>

                    <div></div>
                  </div>


                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-8">
                    <div className="flex flex-col gap-1.5 lg:col-span-3">
                      <label className="text-[13px] font-medium text-slate-700">Street</label>
                      <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="Address.street"
                        name="Address.street"
                        type="text"
                        value={values?.Address?.street}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.street && errors.Address?.street) ? (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.Address.street}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="flex flex-col gap-1.5 lg:col-span-2">
                      <label className="text-[13px] font-medium text-slate-700">City</label>
                      <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="Address.city"
                        name="Address.city"
                        type="text"
                        value={values?.Address?.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.city && errors.Address?.city) ? (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.Address.city}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="flex flex-col gap-1.5 lg:col-span-2">
                      <label className="text-[13px] font-medium text-slate-700">State</label>
                      <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="Address.state"
                        name="Address.state"
                        type="text"
                        value={values?.Address?.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.state && errors.Address?.state) ? (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.Address.state}
                        </div>
                      ) : (<div></div>)}
                    </div>

                    <div className="flex flex-col gap-1.5 lg:col-span-1">
                      <label className="text-[13px] font-medium text-slate-700">Zip Code</label>
                      <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                        id="Address.zipcode"
                        name="Address.zipcode"
                        type="text"
                        value={values?.Address?.zipcode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {(touched.Address?.zipcode && errors.Address?.zipcode) ? (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.Address.zipcode}
                        </div>
                      ) : (<div></div>)}
                    </div>
                  </div>
                  <div className="w-full">
                    <label className="text-[13px] font-medium text-slate-700">Notes</label> <br />
                    <textarea
                      className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                      id="notes"
                      name="notes"
                      value={values.notes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.notes && errors.notes && (
                      <div className="mt-1 text-xs text-red-600">
                        {errors.notes}
                      </div>
                    )}
                  </div>
                  {values.customerType !== 'business' && (
                    <div>
                      <label className="text-[13px] font-medium text-slate-700">
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
                      <span>{selectedCustomer ? "Update" : "Save"}</span> :
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
export default CustomerForm;