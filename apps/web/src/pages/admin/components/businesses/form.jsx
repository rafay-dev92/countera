import React from "react";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "@material-tailwind/react";
import { toast } from 'react-toastify';
import { State } from "@/state/Context";
import dummyImage from "../../../../assets/dummyImage.png";
import { addBusiness } from "@/services/addBusiness";
import { updateBusiness } from "@/services/updateBusiness";

const schema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().required("Email is required"),
    defaultMargin: Yup.string().required("Margin is required"),
    tel: Yup.string().required("Tel is required"),
    fax: Yup.string(),
    licenseNumber: Yup.string(),
    permitNumber: Yup.string(),
    address: Yup.string().required("address is required"),
    city: Yup.string().required("city is required"),
    state: Yup.string().required("state is required"),
    zipcode: Yup.string().required("zipcode is required"),
    image: Yup.mixed().notRequired().test(
        'fileType',
        'Only image files are allowed',
        (value) => {
            if (value == null || value === '') return true;
            if (typeof value === 'string') return true;
            return (
                !value ||
                (value && ['image/jpeg', 'image/png', 'image/gif'].includes(value.type.toLowerCase()))
            );
        }
    )
});
const MyPopUpForm = ({ refresh, setRefresh, open, close, selectedItem, setSelectedItem }) => {

    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);
    const [businessPreviewPic, setBusinessPreviewPic] = useState(null);

    const handleClose = () => {
        clearForm(formikProps);
        setEdit(false);
        setSelectedItem(null);
        setBusinessPreviewPic(null);
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
            // separating image from business data
            const { logo, ...restItemData } = selectedItem;
            if (logo !== 'null') setBusinessPreviewPic(logo);
            formikProps.setValues(selectedItem);
            setEdit(true);
        }
    }, [selectedItem]);

    const onSubmit = async (values) => {
        setIsLoading(true);
        const businessData = new FormData();
        businessData.append('name', values.name);
        businessData.append('email', values.email);
        businessData.append('tel', values.tel);
        businessData.append('fax', values.fax);
        businessData.append('licenseNumber', values.licenseNumber);
        businessData.append('permitNumber', values.permitNumber);
        businessData.append('defaultMargin', values.defaultMargin);
        businessData.append('logo', values.image);
        businessData.append('address', values.address);
        businessData.append('city', values.city);
        businessData.append('state', values.state);
        businessData.append('zipcode', values.zipcode);

        try {
            if (!edit) {
                const res = await addBusiness(businessData, state.userToken);
                const business = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', business.message)
                }
                else if (res.status === 409) {
                    showToastMessage('error', business.message)
                }
            }
            else {
                const res = await updateBusiness(selectedItem.id, businessData, state.userToken);
                const business = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', business.message)
                }
                else if (res.status === 404) {
                    showToastMessage('info', business.message)
                }
                else if (res.status === 409) {
                    showToastMessage('error', business.message)
                }
            }

            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        } catch (error) {
            setIsLoading(false);
            console.log(error)
        }
    };

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                name: "",
                email: "",
                defaultMargin: 10,
                tel: "",
                fax: "",
                licenseNumber: "",
                permitNumber: "",
                address: "",
                city: "",
                state: "",
                zipcode: "",
                image: businessPreviewPic
            },
            errors: {
                name: "",
                email: "",
                defaultMargin: 10,
                tel: "",
                fax: "",
                licenseNumber: "",
                permitNumber: "",
                address: "",
                city: "",
                state: "",
                zipcode: "",
                image: ""
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            name: "",
            email: "",
            defaultMargin: 10,
            tel: "",
            fax: "",
            licenseNumber: "",
            permitNumber: "",
            address: "",
            city: "",
            state: "",
            zipcode: "",
            image: ""
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
        <Dialog open={open}>
            {open && (
                <form onSubmit={handleSubmit} autoComplete="new">
                    <div className="flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                <div className="text-[15px] font-semibold text-slate-900">
                                    {edit ? "Edit business" : "New business"}
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

                            <div className="p-6 overflow-y-auto max-h-[80vh]">
                                <div className="flex justify-between space-x-4 mb-3 w-full">
                                    <div className="basis-[50%]">
                                        <label className="text-[13px] font-medium text-slate-700">Image</label>
                                        <input
                                            className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700"
                                            id="image"
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                setBusinessPreviewPic(URL.createObjectURL(e.target.files[0]))
                                                setFieldValue('image', e.target.files[0]);
                                            }}
                                        />
                                        {touched.image && errors.image ? (
                                            <div className="mt-1 text-xs text-red-600">{errors.image}</div>
                                        ) : null}
                                    </div>
                                    <div className="basis-[50%] max-h-[150px] overflow-hidden max-w-fit">
                                        <img src={businessPreviewPic ? businessPreviewPic : dummyImage} alt="Product" width={150} height={150} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-start space-x-4 mb-3 w-full">
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
                                        {touched.name && errors.name && (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="basis-[30%]">
                                        <label className="text-[13px] font-medium text-slate-700">Email</label>
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="email"
                                            name="email"
                                            value={values.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {touched.email && errors.email ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.email}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="text-[13px] font-medium text-slate-700">Default Margin %</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="defaultMargin"
                                            name="defaultMargin"
                                            type="number"
                                            value={values.defaultMargin}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.defaultMargin && errors.defaultMargin) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.defaultMargin}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-start space-x-4 mb-3 w-full">
                                    <div className="basis-[25%]">
                                        <label className="text-[13px] font-medium text-slate-700">Telephone</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="tel"
                                            name="tel"
                                            type="text"
                                            value={values.tel}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.tel && errors.tel) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.tel}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[25%]">
                                        <label className="text-[13px] font-medium text-slate-700">Fax</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="fax"
                                            name="fax"
                                            type="text"
                                            value={values.fax}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {touched.fax && errors.fax ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.fax}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[25%]">
                                        <label className="text-[13px] font-medium text-slate-700">License Number</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="licenseNumber"
                                            name="licenseNumber"
                                            type="text"
                                            value={values.licenseNumber}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.licenseNumber && errors.licenseNumber) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.licenseNumber}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
                                    <div className="basis-[25%]">
                                        <label className="text-[13px] font-medium text-slate-700">Permit Number</label> <br />
                                        <input
                                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="permitNumber"
                                            name="permitNumber"
                                            value={values.permitNumber}
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
                                <div className="flex items-center justify-start space-x-4">
                                    <div className="basis-[40%]">
                                        <label className="text-[13px] font-medium text-slate-700">Street</label> <br />
                                        <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="address"
                                            name="address"
                                            type="text"
                                            value={values.address}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.address && errors.address) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.address}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="text-[13px] font-medium text-slate-700">City</label> <br />
                                        <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="city"
                                            name="city"
                                            type="text"
                                            value={values.city}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.city && errors.city) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.city}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="text-[13px] font-medium text-slate-700">State</label> <br />
                                        <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="state"
                                            name="state"
                                            type="text"
                                            value={values.state}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.state && errors.state) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.state}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="text-[13px] font-medium text-slate-700">Zip Code</label> <br />
                                        <input className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                            id="zipcode"
                                            name="zipcode"
                                            type="text"
                                            value={values.zipcode}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.zipcode && errors.zipcode) ? (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.zipcode}
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
    );
};
export default MyPopUpForm;