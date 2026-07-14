import React, { useState } from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog, Tooltip } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import { addUser } from "@/services/addUser";
import { updateUser } from "@/services/updateUser";
import { fetchPermissions } from "@/services/fetchPermissions";
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

const UserForm = ({ open, close, selectedItem, setSelectedItem, refresh, setRefresh }) => {

    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [selectPerms, setSelectPerms] = useState([]);

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
        close();
    };

    useEffect(() => {
        getPermissions();
    }, [refresh]);

    const getPermissions = async () => {
        try {
            const res = await fetchPermissions(state.userToken);
            setPermissions(await res.json())
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    useEffect(() => {
        if (selectedItem) {
            const { password, Permission, BusinessId, ...rest } = selectedItem;
            formikProps.setValues(rest);
            setFieldValue('password', undefined);
            setSelectPerms(Permission.map((perm) => (perm.id)));
            setEdit(true);
        }
    }, [selectedItem]);

    const onSubmit = async (values) => {
        setIsLoading(true);
        const updatedValues = { ...values, BusinessId: state.business.id };
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
        setFieldValue,
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
                        <div className="">
                            <div className="bg-white rounded shadow-xl">
                                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <div></div>
                                    <div className="text-white text-center text-lg">
                                        {edit ? "EDIT USER" : "NEW USER"}
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

                                <div className="min-w-[40vw] p-6">
                                    <div className="flex items-center justify-start space-x-4">
                                        <div className="basis-[33.33%]">
                                            <label className="font-bold">First Name</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="first_name"
                                                name="first_name"
                                                type="text"
                                                value={values.first_name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {(touched.first_name && errors.first_name) ? (
                                                <div className="text-red-500">
                                                    {errors.first_name}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                        <div className="basis-[33.33%]">
                                            <label className="font-bold">Last Name</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="last_name"
                                                name="last_name"
                                                type="text"
                                                value={values.last_name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.last_name && errors.last_name ? (
                                                <div className="text-red-500">
                                                    {errors.last_name}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>

                                        <div className="basis-[33.33%]">
                                            <label className="font-bold">Role</label> <br />
                                            <select
                                                id="role"
                                                className="w-56 p-2 border border-gray-400 bg-inherit rounded-md text-gray-600 text-black font-medium"
                                                label="Select Role"
                                                animate={{
                                                    mount: { y: 0 },
                                                    unmount: { y: 25 },
                                                }}
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
                                                size="md"
                                            >
                                                <option key={''} value={''} selected >Select Role</option>
                                                {userRolesForSelect.filter(role => role.value !== UserRole.ADMIN).map((role) => (
                                                    <option key={role.value} value={role.value}>{role.label}</option>
                                                ))}
                                            </select>
                                            {(touched.role && errors.role) ? (
                                                <div className="text-red-500">
                                                    {errors.role}
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
                                            <label className="font-bold">Password</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="password"
                                                name="password"
                                                type="text"
                                                value={values.password}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.password && errors.password && (
                                                <div className="text-red-500">
                                                    {errors.password}
                                                </div>
                                            )}
                                        </div>

                                        <div className="basis-[33.33%]">
                                            <label className="font-bold">DOB</label> <br />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                id="dob"
                                                name="dob"
                                                type="date"
                                                value={values.dob}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            {touched.dob && errors.dob ? (
                                                <div className="text-red-500">
                                                    {errors.dob}
                                                </div>
                                            ) : (<div></div>)}
                                        </div>
                                    </div>

                                    <div className="w-full mt-2">
                                        <div className="flex items-center gap-1 my-2">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-indigo-600 mr-2"
                                                value={selectPerms?.length == permissions?.length}
                                                checked={selectPerms?.length === permissions?.length}
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
                                            <label className="font-bold">Permissions</label>
                                            <Tooltip content="Reset" placement="top" className="z-[9999]">
                                                <TimerReset className="w-6 h-6 text-blue-600 cursor-pointer" onClick={resetPermissions} />
                                            </Tooltip>
                                            {/* <PlusCircleIcon className="w-6 h-6 text-blue-600 cursor-pointer" onClick={openPopup} /> */}
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
                                                    <div key={resource} className="border p-2 rounded shadow-sm bg-gray-50">
                                                        <div className="flex items-center mb-2">
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox text-indigo-600 mr-2"
                                                                checked={allSelected}
                                                                ref={el => {
                                                                    if (el) el.indeterminate = !allSelected && someSelected;
                                                                }}
                                                                onChange={handleGroupToggle}
                                                            />
                                                            <label className="font-semibold capitalize">{resource}</label>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-6">
                                                            {perms.map((permission) => (
                                                                <div key={permission.id} className="flex items-center">
                                                                    <input
                                                                        className="form-checkbox text-indigo-600"
                                                                        type="checkbox"
                                                                        id={`permission-${permission.id}`}
                                                                        checked={selectPerms.includes(permission.id)}
                                                                        onChange={(e) => handlePermission(permission.id, e)}
                                                                    />
                                                                    <label htmlFor={`permission-${permission.id}`} className="ml-2 text-sm capitalize">
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
        </>
    );
};
export default UserForm;