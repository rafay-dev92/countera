import React, { useState } from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog, Tooltip } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import { fetchBusinesses } from "@/services/fetchBusinesses";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { addUser } from "@/services/addUser";
import { updateUser } from "@/services/updateUser";
import { fetchPermissions } from "@/services/fetchPermissions";
import PermissionForm from "../permissions/form";
import { UserRole, userRolesForSelect } from "@countera/shared";
import { TimerReset } from "lucide-react";

const schema = Yup.object().shape({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string().email("Please add a valid email address").required("Email address is required"),
    password: Yup.string(),
    role: Yup.string().required("Role is required"),
    dob: Yup.string().notRequired(),
});

const MyPopUpForm = ({ open, close, selectedItem, setSelectedItem, refresh, setRefresh }) => {
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);
    const [businesses, setBusinesses] = useState([]);
    const [business, setBusiness] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [selectPerms, setSelectPerms] = useState([]);

    // for permission form
    const [isOpen, setIsOpen] = useState(false);

    const openPopup = () => {
        setIsOpen(true);
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
        setSelectPerms([]);
        if (businesses.length > 0) {
            setBusiness(businesses[0].id)
        }
        close();
    };

    useEffect(() => {
        getPermissions();
        getBusinesses();
    }, [refresh]);

    const getPermissions = async () => {
        try {
            const res = await fetchPermissions(state.userToken);
            const permissions = await res.json();
            setPermissions(permissions)
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    const getBusinesses = async () => {
        try {
            const res = await fetchBusinesses(state.userToken);
            const businesses = await res.json();
            if (businesses.length > 0) {
                setBusiness(businesses[0].id)
            }
            setBusinesses(businesses)
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    useEffect(() => {
        if (selectedItem) {
            const { password, Permission, BusinessId, ...rest } = selectedItem;
            formikProps.setValues(rest);
            setBusiness(BusinessId)
            setSelectPerms(Permission.map((perm) => (perm.id)));
            setEdit(true);
        }
    }, [selectedItem]);

    const onSubmit = async (values) => {
        setIsLoading(true);
        const updatedValues = { ...values, BusinessId: business };
        if (values.dob === "") {
            delete updatedValues.dob;
        }
        const userData = {
            user: updatedValues,
            permissions: selectPerms,
        }
        try {
            if (!edit) {
                // saving user data
                const res = await addUser(userData, state.userToken);
                const user = await res.json();
                if (res.status === 200) {
                    showToastMessage('success', user.message)
                }
                else if (res.status === 400) {
                    showToastMessage('info', user.message)
                    setIsLoading(false);
                    return;
                }
                else if (res.status === 409) {
                    showToastMessage('error', user.message)
                }
            }
            else {

                const res = await updateUser(selectedItem.id, userData, state.userToken);
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

    const handlePermission = (id, e) => {
        // const isChecked = e.target.checked;
        // if (isChecked) {
        //     setSelectPerms([...selectPerms, value]);
        // } else {
        //     setSelectPerms(selectPerms.filter(id => id !== value));
        // }
        setSelectPerms(prev =>
            e.target.checked ? [...prev, id] : prev.filter(pid => pid !== id)
        );
    }

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                role: "",
                dob: "",
            },
            errors: {
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                role: "",
                dob: "",
            },
        });
    };

    const formikProps = useFormik({
        initialValues: {
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            role: "",
            dob: "",
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

    const resetPermissions = () => {
        if (!selectedItem) setSelectPerms([]);
        else setSelectPerms(selectedItem?.Permission?.map((perm) => perm.id));
    };

    const groupedPermissions = permissions.reduce((acc, perm) => {
        const [resource, action] = perm.name.split(":");
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push({ ...perm, action });
        return acc;
    }, {});

    return (
        <>
            <Dialog open={open}>
                {open && (
                    <form onSubmit={handleSubmit} autoComplete="new">
                        <div className="flex justify-center w-full">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className="text-[15px] font-semibold text-slate-900">
                                        {edit ? "Edit user" : "New user"}
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

                                <div className="w-[50vw] p-6">
                                    <div className="flex items-center justify-start space-x-4">
                                        <div className="basis-[30%]">
                                            <label className="text-[13px] font-medium text-slate-700">First Name</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="first_name"
                                                name="first_name"
                                                type="text"
                                                value={values.first_name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {(touched.first_name && errors.first_name) ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.first_name}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="basis-[30%]">
                                            <label className="text-[13px] font-medium text-slate-700">Last Name</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="last_name"
                                                name="last_name"
                                                type="text"
                                                value={values.last_name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.last_name && errors.last_name ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.last_name}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>

                                        <div className="basis-[20%]">
                                            <label className="text-[13px] font-medium text-slate-700">Role</label> <br />
                                            <select
                                                id="role"
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                value={values.role}
                                                onChange={(e) => {
                                                    const selectedRole = e.target.value;
                                                    handleChange(e);
                                                    if (selectedRole === UserRole.ADMIN || selectedRole === UserRole.MANAGER) {
                                                        const allPermissionIds = permissions.map((perm) => perm.id);
                                                        setSelectPerms(allPermissionIds);
                                                    } else {
                                                        setSelectPerms([]);
                                                    }
                                                }}
                                                onBlur={handleBlur}
                                                required
                                            >
                                                <option key={''} value={''} disabled>Select Role</option>
                                                {userRolesForSelect.map((role) => (
                                                    <option key={role.value} value={role.value}>{role.label}</option>
                                                ))}
                                            </select>

                                            {touched.role && errors.role && (
                                                <div className="mt-1 text-xs text-red-600">{errors.role}</div>
                                            )}
                                        </div>


                                        <div className="basis-[20%]">
                                            <label className="text-[13px] font-medium text-slate-700">DOB</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="dob"
                                                name="dob"
                                                type="date"
                                                value={values.dob}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.dob && errors.dob ? (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.dob}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-start space-x-4">
                                        <div className="basis-[33.33%]">
                                            <label className="text-[13px] font-medium text-slate-700">Email</label> <br />
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
                                        <div className="basis-[33.33%]">
                                            <label className="text-[13px] font-medium text-slate-700">Password</label> <br />
                                            <input
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                id="password"
                                                name="password"
                                                type="text"
                                                value={values.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.password && errors.password && (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.password}
                                                </div>
                                            )}
                                        </div>

                                        <div className="basis-[33.33%]">
                                            <label className="text-[13px] font-medium text-slate-700">Business</label> <br />
                                            <select
                                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                                                label="Select Business"
                                                animate={{
                                                    mount: { y: 0 },
                                                    unmount: { y: 25 },
                                                }}
                                                value={business}
                                                onChange={(e) =>
                                                    setBusiness(e.target.value)
                                                }
                                                size="md"
                                                disabled={state.userInfo.role !== 'SUPER_ADMIN'}
                                            >
                                                {businesses ?
                                                    businesses.map((business) => (
                                                        <option key={business.id} value={business.id}>{business.name}</option>
                                                    )) : []}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="w-full mt-2">
                                        <div className="flex items-center gap-1 my-4">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox accent-teal-600 text-teal-600 mr-2"
                                                value={selectPerms.length == permissions.length}
                                                checked={selectPerms.length === permissions.length}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked;
                                                    handleChange(e);
                                                    if (isChecked) {
                                                        const allPermissionIds = permissions.map((perm) => perm.id);
                                                        setSelectPerms(allPermissionIds);
                                                    } else {
                                                        setSelectPerms([]);
                                                    }
                                                }}
                                            />
                                            <label className="text-[13px] font-medium text-slate-700">Permissions</label>
                                            <Tooltip content="Reset" placement="top" className="z-[9999]">
                                                <TimerReset className="w-6 h-6 text-teal-700 cursor-pointer" onClick={resetPermissions} />
                                            </Tooltip>

                                            {/* <PlusCircleIcon className="w-6 h-6 text-teal-700 cursor-pointer" onClick={openPopup} /> */}
                                        </div>

                                        <div className="space-y-4 h-56 overflow-y-auto">
                                            {Object.entries(groupedPermissions).map(([resource, perms]) => {
                                                const allSelected = perms.every(p => selectPerms.includes(p.id));
                                                const someSelected = perms.some(p => selectPerms.includes(p.id));

                                                const handleGroupToggle = () => {
                                                    if (allSelected) {
                                                        // Uncheck all
                                                        perms.forEach(p => handlePermission(p.id, { target: { checked: false } }));
                                                    } else {
                                                        // Check all
                                                        perms.forEach(p => handlePermission(p.id, { target: { checked: true } }));
                                                    }
                                                };

                                                return (
                                                    <div key={resource} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                                                        <div className="flex items-center mb-2">
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox accent-teal-600 text-teal-600 mr-2"
                                                                checked={allSelected}
                                                                ref={el => {
                                                                    if (el) el.indeterminate = !allSelected && someSelected;
                                                                }}
                                                                onChange={handleGroupToggle}
                                                            />
                                                            <label className="text-[13px] font-semibold capitalize text-slate-900">{resource}</label>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-6">
                                                            {perms.map((permission) => (
                                                                <div key={permission.id} className="flex items-center">
                                                                    <input
                                                                        className="form-checkbox accent-teal-600 text-teal-600"
                                                                        type="checkbox"
                                                                        id={`permission-${permission.id}`}
                                                                        checked={selectPerms.includes(permission.id)}
                                                                        onChange={(e) => handlePermission(permission.id, e)}
                                                                    />
                                                                    <label htmlFor={`permission-${permission.id}`} className="ml-2 text-sm capitalize text-slate-700">
                                                                        {permission.action}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
            <PermissionForm refresh={refresh} setRefresh={setRefresh} open={isOpen} close={closePopup} selectedItem={null} setSelectedItem={null} />
        </>
    );
};
export default MyPopUpForm;