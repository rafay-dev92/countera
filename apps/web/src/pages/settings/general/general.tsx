import React, { useEffect, useState, useMemo, useRef } from "react";
import { Input, Button } from "@material-tailwind/react";
import { State } from '../../../state/Context'
import { updateBusiness } from "@/services/updateBusiness";
import { toast } from "react-toastify";
import dummyImage from "../../../assets/dummyImage.png"
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from 'quill';

function Profile() {
    const timezones = Intl.supportedValuesOf('timeZone');
    const { state, dispatch } = State();
    const [invoice, setInvoice] = useState(state.Settings.General.invoice);
    const [busiensslogo, setBusiensslogo] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({
        name: "",
        email: "",
        logo: null,
        defaultMargin: "",
        address: "",
        city: "",
        state: "",
        zipcode: "",
        timezone: "",
        tel: "",
        fax: "",
        licenseNumber: "",
        permitNumber: "",
        termsAndConditions: "",
    });

    // const Size = Quill.import('attributors/class/size');
    // Size.whitelist = ['small', 'base', 'large', 'huge'];
    // Quill.register(Size, true);


    const quillModules = {
        toolbar: [
            [{ 'font': [] }, { 'size': [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean']
        ]
    };

    const quillFormats = [
        'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'header',
        'align',
        'blockquote', 'code-block',
        'list', 'bullet', 'indent',
        'link', 'image', 'video'
    ];

    const allTimezones = useMemo(() => Intl.supportedValuesOf('timeZone'), []);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filteredTimezones = useMemo(() => {
        return allTimezones.filter(tz =>
            tz.toLowerCase().includes(formData.timezone.toLowerCase())
        );
    }, [formData.timezone]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (tz: string) => {
        setFormData({ ...formData, timezone: tz });
        setShowSuggestions(false);
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

    const invoiceOptions = [
        { value: 'current', label: 'current' },
        { value: 'all', label: 'all' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value, files } = e.target as { name: string; value: any; files: FileList | null };
        const REQUIRED_WIDTH = 300;
        const REQUIRED_HEIGHT = 300;

        if (files) {
            const img = new Image();
            img.src = URL.createObjectURL(e.target.files![0]);

            img.onload = () => {
                showToastMessage('success', 'Image uploaded successfully');
                // if (img.width === REQUIRED_WIDTH && img.height === REQUIRED_HEIGHT) {
                // } else {
                //     showToastMessage('error', `Invalid dimensions! Please upload an image of ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px.`);
                // }
                URL.revokeObjectURL(img.src)
            }
        }
        if (name === 'defaultMargin' || name === 'zipcode') value = parseInt(value);
        setFormData({
            ...formData,
            [name]: files ? files[0] : value,
        });
    };

    const handleSave = async () => {
        const isUpdated = Object.values(formData).some((value) => !Object.values(state.business!).includes(value));
        if (isUpdated) {
            const businessData = new FormData();
            const avoidFields = ['updated_at', 'created_at', 'id'];
            Object.values(formData).forEach((value, index) => {
                if (value !== null && !avoidFields.includes(Object.keys(formData)[index])) {
                    businessData.append(Object.keys(formData)[index], value);
                }
            });
            const res = (await updateBusiness(state.business!.id, businessData, state.userToken))!;
            if (res.status === 200) {
                const business = await res.json();
                const { logo, ...rest } = business.data;
                setBusiensslogo(logo);
                setFormData(rest);
                dispatch({ type: 'SET_BUSINESS', payload: business.data });
                showToastMessage('success', 'Business Details Updated Successfully');
                setFormData({ lg: null, ...business.data });
                return;
            }
            showToastMessage('error', 'Failed to update Business Details');
        }
    };

    // for invoice setting!!
    const handleSaveClick = async () => {
        dispatch({ type: 'SET_INVOICE', payload: invoice });
    }

    useEffect(() => {
        const { logo } = state.business!;
        setBusiensslogo(logo);
        setFormData(state.business!);
    }, [])

    // for invoice setting!!
    // useEffect(() => {
    //     console.log(state);
    // }, [state.Settings])

    return (
        <div className="flex flex-col w-full rounded-lg border border-slate-200 bg-white divide-y divide-slate-200 scroll-smooth">
            {/* General Form */}
            <div className="p-5 w-full lg:w-[60%] 2xl:w-[50%]">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">General</h2>
                {/* <form className="flex flex-col space-y-4 w-48">
                    <Select
                        label="Invoice Setting"
                        animate={{
                            mount: { y: 0 },
                            unmount: { y: 25 },
                        }}
                        value={state.Settings.General.invoice}
                        onChange={(value) => setInvoice(value)}
                        size="md"
                    >
                        {invoiceOptions.map((option) => (
                            <Option key={option.value} value={option.value}>{option.label}</Option>
                        ))}
                    </Select>

                    <Button onClick={handleSaveClick}>Save</Button>
                </form> */}
                <div className="flex flex-col gap-5">
                    <Input
                        crossOrigin={undefined}
                        label="Name"
                        type="text"
                        name="name"
                        value={formData?.name}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="Email"
                        type="text"
                        name="email"
                        value={formData?.email}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="License Number"
                        type="text"
                        name="licenseNumber"
                        value={formData?.licenseNumber}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="Permit Number"
                        type="text"
                        name="permitNumber"
                        value={formData?.permitNumber}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="Default Margin"
                        type="number"
                        name="defaultMargin"
                        value={formData?.defaultMargin}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="Logo"
                        type="file"
                        name="logo"
                        accept="image/*"
                        onChange={(e) => { handleChange(e); setBusiensslogo(URL.createObjectURL(e.target.files![0])) }}
                    />
                    <div className="basis-[50%] max-h-[150px] max-w-[150px] bg-auto bg-center overflow-hidden">
                        <img className="" src={busiensslogo ? busiensslogo : dummyImage} alt="Business logo" width={150} height={150} />
                    </div>
                </div>
                <Button
                    className="float-right mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium normal-case text-white shadow-none hover:bg-teal-800 hover:shadow-none"
                    onClick={() => handleSave()}
                >
                    Save
                </Button>
            </div>
            {/* Address Form */}
            <div className="p-5 w-full md:w-[70%] lg:w-[60%] 2xl:w-[50%]">
                {/* Address Form */}
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Address</h3>
                <div className="flex flex-col gap-5">
                    <Input
                        crossOrigin={undefined}
                        label="Address"
                        type="text"
                        name="address"
                        value={formData?.address}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="City"
                        type="text"
                        name="city"
                        value={formData?.city}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="State"
                        type="text"
                        name="state"
                        value={formData?.state}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="Zip Code"
                        type="text"
                        name="zipcode"
                        value={formData?.zipcode}
                        onChange={handleChange}
                    />
                    <div ref={ref} className="relative w-full">
                        <Input
                            crossOrigin={undefined}
                            label="Timezone"
                            name="timezone"
                            value={formData?.timezone}
                            onChange={(e) => {
                                setFormData({ ...formData, timezone: e.target.value });
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                        />

                        {showSuggestions && (
                            <ul className="absolute z-50 bg-white border border-slate-200 w-full mt-1 overflow-y-auto min-h-20 max-h-48 rounded-md shadow-lg">
                                {filteredTimezones.length > 0 ? (
                                    filteredTimezones.slice(0, 50).map((tz) => (
                                        <li
                                            key={tz}
                                            onClick={() => handleSelect(tz)}
                                            className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            {tz}
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-3 py-2 text-sm text-slate-500">No results found</li>
                                )}
                            </ul>
                        )}
                    </div>

                </div>
                <Button
                    className="float-right mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium normal-case text-white shadow-none hover:bg-teal-800 hover:shadow-none"
                    onClick={() => handleSave()}
                >
                    Save
                </Button>
            </div>
            {/* Phone Form */}
            <div className="p-5 w-full md:w-[70%] lg:w-[60%] 2xl:w-[50%]">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Phone</h3>
                <div className="flex flex-col gap-5">
                    <Input
                        crossOrigin={undefined}
                        label="Telephone"
                        type="tel"
                        name="tel"
                        value={formData?.tel}
                        onChange={handleChange}
                    />
                    <Input
                        crossOrigin={undefined}
                        label="Fax"
                        type="tel"
                        name="fax"
                        value={formData?.fax}
                        onChange={handleChange}
                    />
                </div>
                <Button
                    className="float-right mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium normal-case text-white shadow-none hover:bg-teal-800 hover:shadow-none"
                    onClick={() => handleSave()}
                >
                    Save
                </Button>
            </div>

            <div className="p-5 w-full md:w-[70%] lg:w-[60%] 2xl:w-[50%]">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Invoice</h3>

                <ReactQuill
                    value={formData.termsAndConditions}
                    onChange={(value) =>
                        setFormData((prev) => ({ ...prev, termsAndConditions: value }))
                    }
                    modules={quillModules}
                    formats={quillFormats}
                />

                <Button
                    className="float-right mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium normal-case text-white shadow-none hover:bg-teal-800 hover:shadow-none"
                    onClick={() => handleSave()}
                >
                    Save
                </Button>
            </div>
        </div>
    );
}

export default Profile;