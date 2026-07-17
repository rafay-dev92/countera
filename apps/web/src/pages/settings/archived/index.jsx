import React, { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Tooltip, IconButton, Spinner } from "@material-tailwind/react";
// import PackageForm from "./packageForm";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useConfirm } from "@/context/confirmContext";
import { fetchArchivedInvoices } from "@/services/fetchArchivedInvoices";
import { delArchivedInvoice } from "@/services/delArchivedInvoice";
import ReactToPrint from "react-to-print";
import PrintView from "./printView";

const TABLE_HEAD = ["Invoice", "Customer", "Total", "Status", "Invoice Date", "Vehicle", "Actions"];

function Archived() {
    const componentRef = useRef();
    const printRef = useRef();
    const reactToPrintRef = useRef();
    const confirm = useConfirm();
    const { state } = State();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [appliedTaxes, setAppliedTaxes] = useState({});

    // for edit of a vehicle 
    const [selectedItem, setSelectedItem] = useState(null);

    // for filtering
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Function to handle pagination
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Popup state
    const [isOpen, setIsOpen] = useState(false);
    const openPopup = () => {
        setIsOpen(true);
    };
    const closePopup = () => {
        // setIsOpen(false);
    };

    useEffect(() => {
        getArchivedInvoices();
    }, [refresh])

    const getArchivedInvoices = async () => {
        try {
            const res = await fetchArchivedInvoices(state.userToken);
            const invoices = await res.json();
            setInvoices(invoices.data);
            setLoading(false);
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    // Function to handle deletion of selected items
    const handleDelete = async (id) => {
        const confirmed = await confirm("Do you really want to delete this invoice?");
        if (!confirmed) return;
        try {
            const res = await delArchivedInvoice(id, state.userToken);
            const tax = await res.json();
            if (res.status === 200) {
                toast.success(tax.message)
            }
            else if (res.status === 404) {
                toast.info(tax.message)
            }
            else if (res.status === 500) {
                toast.error("You must delete its foreign key relations first");
            }
            setRefresh(!refresh);
        } catch (error) {
            console.log(error)
            showToastMessage('error', "You must delete its foreign key relations first");
        }
    };

    const handleEditInvoice = async (index) => {
        // setLoading(true);
        const selected = filteredRows[index];
        recalculateTaxes(selected.Products, selected.Customer);
        setSelectedItem(selected);

        setTimeout(() => {
            if (reactToPrintRef.current) {
                reactToPrintRef.current.handlePrint();
                // setLoading(false);
            } else {
                toast.error("Print ref not ready");
            }
        }, 500);
    };

    const recalculateTaxes = (products, selectedCustomer) => {
        const productTaxes = {};

        products.forEach((product) => {
            product.Tax?.forEach((productTax) => {
                const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

                if (productTax.name === 'Sales Tax' && !selectedCustomer?.taxable) {
                    return;
                }

                if (!productTaxes[key]) {
                    productTaxes[key] = 0;
                }

                if (productTax.type === "%") {
                    productTaxes[key] += product.archived_invoice_product.price * product.archived_invoice_product.quantity * (productTax.rate / 100);
                } else {
                    productTaxes[key] += product.archived_invoice_product.quantity * productTax.rate;
                }
            });
        });
        setAppliedTaxes(productTaxes);
    };

    const formatCreatedAt = (createdAt) => {
        const date = new Date(createdAt);
        return date.toLocaleString();
    };

    let filteredRows = [];
    if (invoices?.length !== 0) {
        filteredRows = invoices?.filter(
            ({ Customer }) =>
                Customer['firstName'].toLowerCase().includes(searchQuery.toLowerCase()) ||
                Customer['lastName'].toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    // Function to handle items per page change
    const handleItemsPerPageChange = (event) => {
        const selectedItemsPerPage = parseInt(event.target.value, 10);
        setItemsPerPage(selectedItemsPerPage);
        setCurrentPage(1);
    };

    const invoiceStatusColors = {
        "PAID": "green",
        "PARTIALLY_PAID": "orange",
        "UNPAID": "red",
        "VOID": "purple",
        "REFUND": "blue",
    };

    if (loading) {
        return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-slate-400" />
    }
    return (
        <>
            <Card className="w-full lg:max-h-[80vh] lg:overflow-y-auto">
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="flex flex-col md:flex-row items-center w-full h-max py-3 gap-4">
                        <div className="w-full md:w-auto flex items-center justify-start gap-2">
                            <Typography variant="h5" color="blue-gray" className="flex items-center">
                                Archived Invoices
                            </Typography>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start gap-3 w-full md:w-auto md:ml-auto">
                            <div className="w-full sm:w-auto md:flex-1 md:mr-4">
                                <Input
                                    label="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    icon={<MagnifyingGlassIcon className="h-4 w-4 md:h-5 md:w-5" />}
                                    className="text-xs md:text-sm lg:text-base"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Tooltip content="Items per page">
                                    <select
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                        className="px-2 py-2 border border-blue-gray-300 rounded bg-white text-blue-gray-700 text-xs md:text-sm"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                    </select>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="p-2 overflow-auto px-0">
                    <table className="w-full min-w-max table-auto text-left">
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
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(({ id, invoiceNumber, Customer, paymentStatus, totalAmount, createdAt, CustomerVehicle }, index) => {
                                const isLast = index === currentItems.length - 1;
                                const classes = isLast
                                    ? "p-2"
                                    : "p-2 border-b border-blue-gray-50";
                                const isChecked = selectedRows.includes(index);
                                return (
                                    <tr key={id}>
                                        <td className={classes}>
                                            <button
                                                className="text-blue-gray font-normal hover:underline"
                                                onClick={() => handleEditInvoice(index)}
                                            >
                                                INV{`${invoiceNumber}`.padStart(4, '0')}
                                            </button>
                                        </td>
                                        <td className={classes}>
                                            {/* <Link
                                                to="#"
                                                className="text-blue-gray font-normal hover:underline"
                                                onClick={() => showCustomer(index)}
                                            >
                                                {Customer['firstName']} {Customer['lastName']}
                                            </Link> */}
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {Customer['firstName']} {Customer['lastName']}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {totalAmount}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color={invoiceStatusColors[paymentStatus] || "gray"}
                                                className="font-medium"
                                            >
                                                {paymentStatus}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {formatCreatedAt(createdAt)}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {`${CustomerVehicle['make']} ${CustomerVehicle['model']} ${CustomerVehicle['year']}`}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Tooltip content="Delete Invoice">
                                                <IconButton variant="text" onClick={() => handleDelete(id)}>
                                                    <TrashIcon className="h-6 w-6 text-red-500" />
                                                </IconButton>
                                            </Tooltip>

                                        </td>
                                    </tr>
                                );
                            },
                            )}
                        </tbody>
                    </table>
                </CardBody>
                <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRows.length)} of {filteredRows.length}
                    </Typography>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Page {currentPage} of {Math.ceil(filteredRows.length / itemsPerPage)}
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
                            disabled={indexOfLastItem >= filteredRows.length}
                            onClick={() => paginate(currentPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardFooter>

            </Card>
            <ReactToPrint
                trigger={() => <></>}
                content={() => componentRef.current}
                ref={reactToPrintRef}
            />
            {selectedItem && Object.keys(selectedItem).length > 0 ? (
                <PrintView
                    view={false}
                    printInvoice={selectedItem}
                    ref={componentRef}
                    appliedTaxes={appliedTaxes}
                />
            ) : null}
        </>
    );
}

export default Archived;