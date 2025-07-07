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
                        <div className="bg-white rounded shadow-xl">
                            <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                <div></div>
                                <div className="text-white text-center text-lg">
                                    {edit ? "Edit Business" : "New Business"}
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

                            <div className="p-6 overflow-y-auto max-h-[80vh]">
                                <div className="flex justify-between space-x-4 mb-3 w-full">
                                    <div className="basis-[50%]">
                                        <label className="font-bold">Image</label>
                                        <input
                                            className="w-full p-2 border border-gray-300 bg-inherit rounded-md"
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
                                            <div className="text-red-500">{errors.image}</div>
                                        ) : null}
                                    </div>
                                    <div className="basis-[50%] max-h-[150px] overflow-hidden max-w-fit">
                                        <img src={businessPreviewPic ? businessPreviewPic : dummyImage} alt="Product" width={150} height={150} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-start space-x-4 mb-3 w-full">
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
                                        {touched.name && errors.name && (
                                            <div className="text-red-500">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="basis-[30%]">
                                        <label className="font-bold">Email</label>
                                        <input
                                            className="w-full p-2 border border-gray-300 bg-inherit rounded-md text-black font-medium"
                                            id="email"
                                            name="email"
                                            value={values.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {touched.email && errors.email ? (
                                            <div className="text-red-500">
                                                {errors.email}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="font-bold">Default Margin %</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="defaultMargin"
                                            name="defaultMargin"
                                            type="number"
                                            value={values.defaultMargin}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.defaultMargin && errors.defaultMargin) ? (
                                            <div className="text-red-500">
                                                {errors.defaultMargin}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-start space-x-4 mb-3 w-full">
                                    <div className="basis-[25%]">
                                        <label className="font-bold">Telephone</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="tel"
                                            name="tel"
                                            type="text"
                                            value={values.tel}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.tel && errors.tel) ? (
                                            <div className="text-red-500">
                                                {errors.tel}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[25%]">
                                        <label className="font-bold">Fax</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="fax"
                                            name="fax"
                                            type="text"
                                            value={values.fax}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {touched.fax && errors.fax ? (
                                            <div className="text-red-500">
                                                {errors.fax}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[25%]">
                                        <label className="font-bold">License Number</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="licenseNumber"
                                            name="licenseNumber"
                                            type="text"
                                            value={values.licenseNumber}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.licenseNumber && errors.licenseNumber) ? (
                                            <div className="text-red-500">
                                                {errors.licenseNumber}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>
                                    <div className="basis-[25%]">
                                        <label className="font-bold">Permit Number</label> <br />
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                            id="permitNumber"
                                            name="permitNumber"
                                            value={values.permitNumber}
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
                                <div className="flex items-center justify-start space-x-4">
                                    <div className="basis-[40%]">
                                        <label className="font-bold">Street</label> <br />
                                        <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                                            id="address"
                                            name="address"
                                            type="text"
                                            value={values.address}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.address && errors.address) ? (
                                            <div className="text-red-500">
                                                {errors.address}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="font-bold">City</label> <br />
                                        <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                                            id="city"
                                            name="city"
                                            type="text"
                                            value={values.city}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.city && errors.city) ? (
                                            <div className="text-red-500">
                                                {errors.city}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="font-bold">State</label> <br />
                                        <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                                            id="state"
                                            name="state"
                                            type="text"
                                            value={values.state}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.state && errors.state) ? (
                                            <div className="text-red-500">
                                                {errors.state}
                                            </div>
                                        ) : (<div></div>)}
                                    </div>

                                    <div className="basis-[20%]">
                                        <label className="font-bold">Zip Code</label> <br />
                                        <input className="p-2 w-full border border-gray-300 rounded-md text-black font-medium"
                                            id="zipcode"
                                            name="zipcode"
                                            type="text"
                                            value={values.zipcode}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {(touched.zipcode && errors.zipcode) ? (
                                            <div className="text-red-500">
                                                {errors.zipcode}
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
    );
};
export default MyPopUpForm;