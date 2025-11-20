import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    Input,
    Typography,
    Button,
    CardBody,
    CardFooter,
    IconButton,
    Tooltip,
    Spinner,
} from "@material-tailwind/react";
import { DocumentTextIcon, TrashIcon, DocumentPlusIcon } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import MyPopUpForm from "./form";
import { Link, useNavigate } from "react-router-dom";
import { State } from "../../state/Context";
import { toast } from "react-toastify";
import { addInvoice } from "@/services/addInvoice";
import { useConfirm } from "@/context/confirmContext";
import { fetchWorkOrders } from "@/services/fetchWorkOrders";
import { delWorkOrder } from "@/services/delWorkOrder";
import CustomerForm from "../invoice/customerForm";

const TABLE_HEAD = ["WorkOrder", "Customer", "Total", "Status", "WorkOrder Date", "Vehicle", "Actions"];

export function WorkOrder() {
    const confirm = useConfirm();
    const router = useNavigate();
    const { state, dispatch } = State();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [workOrders, setWorkOrders] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [refresh, setRefresh] = useState(false);
    const [selectedWorkOrder, setSelectetWorkOrder] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

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
    
    const getWorkOrders = async () => {
        try {
            const filters = {
                status: ["PENDING", "FINISHED"]
            };

            if (debouncedTerm && debouncedTerm.trim()) {
                filters.CustomerDetails = { name: debouncedTerm };
            }

            const response = await fetchWorkOrders(state.userToken, currentPage, itemsPerPage, filters);
            const totalWorkOrders = await response.json();
            setWorkOrders(totalWorkOrders?.data || []);
            setTotalCount(totalWorkOrders.total || 0);
        } catch (error) {
            console.error(error.message);
            showToastMessage('error', 'Something went wrong')
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);
    
    useEffect(() => {
        getWorkOrders();
    }, [refresh, currentPage, itemsPerPage, debouncedTerm]);

    const handleEditWorkOrder = (index) => {
        const selected = workOrders[index];
        setSelectetWorkOrder(selected);
        openPopup();
    };

    const handleDeleteWorkOrder = async (index) => {
        const confirmed = await confirm("Do you really want to delete this workorder?");
        if (!confirmed) return;
        const deletedWorkOrderId = workOrders[index];
        try {
            const res = await delWorkOrder(deletedWorkOrderId['id'], state.userToken);
            const workorder = await res.json();
            if (res.status === 200) {
                showToastMessage('success', workorder.message)
            }
            else if (res.status === 403) {
                showToastMessage('info', workorder.message)
            }
            else if (res.status === 404) {
                showToastMessage('info', workorder.message)
            }
            setRefresh(!refresh);

        } catch (error) {
            console.error(error);
            showToastMessage('error', "Something went wrong");
        }
    };

    const showCustomer = (index) => {
        const selected = workOrders[index];
        setIsCustomerFormOpen(true);
        setSelectedCustomer(selected.Customer);
    }
    const formatCreatedAt = (createdAt) => {
        const date = new Date(createdAt);
        return date.toLocaleString();
    };

    const handleItemsPerPageChange = (event) => {
        const selectedItemsPerPage = parseInt(event.target.value, 10);
        setItemsPerPage(selectedItemsPerPage);
        setCurrentPage(1);
    };

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

    const openPopup = () => {
        setIsOpen(true);
    };

    const closePopup = () => {
        setIsOpen(false);
    };

    const createInvoice = async (workOrderData) => {
        const confirmed = await confirm("Are you sure you want to create an invoice for this work order?");
        if (!confirmed) return;
        setLoading(true);
        const selectedProductIds = workOrderData?.Product?.map((product) => ({
            id: product.id,
            quantity: product.workorder_product.quantity,
            description: product.workorder_product.description || '',
            price: product.workorder_product.price
        })).filter(product => product.id);

        const taxes = Object.values(JSON.parse(workOrderData.appliedTaxes || '{}')).map(tax => tax);
        const data = {
            invoiceData: {
                totalAmount: workOrderData.totalAmount,
                CustomerId: workOrderData.CustomerId,
                CustomerVehicleId: workOrderData.CustomerVehicleId,
                comments: workOrderData.comments,
                notes: workOrderData.notes,
                discount: workOrderData.discount,
                labour: workOrderData.labour,
                BusinessId: state.business.id
            },
            "products": selectedProductIds,
            "taxes": taxes
        };

        try {
            const res = await addInvoice(data, state.userToken)
            const invoice = await res.json();
            if (res.status === 200) {
                showToastMessage('success', invoice.message);
                dispatch({ type: 'SET_INVOICE_VIEW_DATA', payload: invoice.data });
                dispatch({ type: 'SET_INVOICE_VIEW', payload: true });
                dispatch({ type: 'SET_INVOICE_FORM', payload: true });
                router('/dashboard/invoice');
            }
            else if (res.status === 403) {
                showToastMessage('info', invoice.message)
            }
            else if (res.status === 404) {
                showToastMessage('info', invoice.message)
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error(error);
        }
    };

    if (loading) {
        return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-gray-900/50" />
    }
    return (
        <>
            <Card className="h-full w-full ">
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="mb-4 sm:mb-0 flex items-center">
                        <Typography variant="h5" color="blue-gray" className="flex items-center">
                            <DocumentTextIcon className="h-12 w-12 text-blueGray-500 ml-2" />
                            Work Orders
                        </Typography>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center w-full mt-5">
                        <div className="w-full lg:w-2/5 flex items-center justify-center lg:justify-start gap-2">
                            <div className="w-full lg:flex-1 lg:mr-4">
                                <Input
                                    label="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                />
                            </div>
                            <div className="flex gap-2 lg:gap-4">
                                <Button disabled={!state.userInfo?.Permission.includes("workorder:create")} className={`w-full bg-blue-900 lg:w-auto`} size="md" onClick={openPopup} >
                                    New
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center mt-4 lg:mt-0 lg:ml-auto">
                            <Typography variant="small" color="blue-gray" className="mr-2">
                                Items per page:
                            </Typography>
                            <select
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="px-2 py-1 border border-blue-gray-300 rounded bg-white text-blue-gray-700"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="p-2 overflow-scroll px-0">
                    <table className=" w-full min-w-max table-auto text-left">
                        <thead>
                            <tr>
                                {TABLE_HEAD.map((head) => (
                                    <th
                                        key={head}
                                        className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                                    >
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none opacity-70"
                                        >
                                            {head}
                                        </Typography>
                                    </th>
                                ))}
                                {state.userInfo.role === 'super_admin' && (
                                    <th
                                        key={'BUSINESS'}
                                        className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                                    >
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none opacity-70"
                                        >
                                            BUSINESS
                                        </Typography>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {workOrders.map(({ id, workOrderNumber, Customer, totalAmount, status, createdAt, CustomerVehicle, Business }, index) => {
                                const isLast = index === workOrders.length - 1;
                                const classes = isLast
                                    ? "p-4"
                                    : "p-4 border-b border-blue-gray-50";
                                return (
                                    <tr key={id}>
                                        <td className={classes}>
                                            <Link
                                                to="#"
                                                className="text-blue-gray font-normal hover:underline"
                                                onClick={() => {
                                                    handleEditWorkOrder(index);
                                                }}
                                            >
                                                WOR{`${workOrderNumber}`.padStart(4, '0')}
                                            </Link>
                                        </td>

                                        <td className={classes}>
                                            <Link
                                                to="#"
                                                className="text-blue-gray font-normal hover:underline"
                                                onClick={() => {
                                                    showCustomer(index);
                                                }}
                                            >
                                                {Customer['firstName']} {Customer['lastName']}
                                            </Link>
                                        </td>

                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal"
                                            >
                                                {totalAmount}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color={status === 'FINISHED' ? "green" : "red"}
                                                className="font-medium"
                                            >
                                                {status}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal "
                                            >
                                                {formatCreatedAt(createdAt)}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal "
                                            >
                                                {`${CustomerVehicle['make']} ${CustomerVehicle['model']} ${CustomerVehicle['year']}`}
                                            </Typography>
                                        </td>

                                        <td className={classes}>
                                            <Tooltip content="Delete WorkOrder">
                                                <IconButton variant="text" onClick={() => {
                                                    handleDeleteWorkOrder(index)
                                                }}>
                                                    <TrashIcon className="h-6 w-6 text-red-500" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip content="Create Invoice">
                                                <IconButton variant="text" onClick={() => {
                                                    createInvoice(workOrders[index])
                                                }}>
                                                    <DocumentPlusIcon className="h-6 w-6 text-blue-500" />
                                                </IconButton>
                                            </Tooltip>
                                        </td>
                                        {state.userInfo.role === 'super_admin' && (
                                            <td className={classes}>
                                                <Typography
                                                    variant="small"
                                                    color="blue-gray"
                                                    className="font-normal opacity-70"
                                                >
                                                    {Business?.name}
                                                </Typography>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardBody>
                <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Showing {startIndex} - {endIndex} of {totalCount}
                    </Typography>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Page {currentPage} of {totalPages}
                    </Typography>
                    <div className="flex gap-2">
                        <Button
                            variant="outlined"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => paginate(currentPage - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outlined"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => paginate(currentPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardFooter>

            </Card>
            <CustomerForm open={isCustomerFormOpen} close={() => setIsCustomerFormOpen(false)} refresh={refresh} setRefresh={setRefresh} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />
            <MyPopUpForm refresh={refresh} setRefresh={setRefresh} open={isOpen} close={closePopup} selectedWorkOrder={selectedWorkOrder} setSelectetWorkOrder={setSelectetWorkOrder} />
        </>
    );
}   