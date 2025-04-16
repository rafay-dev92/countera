import React, { useState, useEffect, useRef } from "react";
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
import { DocumentTextIcon, TrashIcon } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import MyPopUpForm from "./form";
import { fetchInvoices } from "@/services/fetchInvoices";
import { delInvoice } from "@/services/delInvoice";
import { Link } from "react-router-dom";
import { State } from "../../state/Context";
import { toast } from "react-toastify";
import { useConfirm } from "@/context/confirmContext";
import { softDelInvoice } from "@/services/softDelInvoice";
import { useDeleteInvoiceConfirm } from "@/context/deleteInvoiceConfirmContext";
import CustomerForm from "./customerForm";

const TABLE_HEAD = ["Invoice", "Customer", "Total", "Status", "Invoice Date", "Vehicle", "Actions"];

export function Invoice() {
  const confirm = useConfirm();
  const confirmDeleteInvoice = useDeleteInvoiceConfirm();
  const { state, dispatch } = State();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

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

  const getInvoices = async () => {
    try {
      const response = await fetchInvoices(state.userToken, currentPage, itemsPerPage);
      const totalInvoices = await response.json();
      setInvoices(
        totalInvoices.data?.filter(
          invoice => invoice.paymentStatus !== 'Refund' && invoice.paymentStatus !== 'Void'
        )
      );

      setTotalCount(totalInvoices.total || 0);
      setLoading(false);
    } catch (error) {
      console.log(error.message);
      showToastMessage('error', "Something went wrong");
    }
  };

  useEffect(() => {
    getInvoices();
  }, [refresh, currentPage, itemsPerPage]);

  const handleEditInvoice = (index) => {
    if (state.userInfo.Permission.some(obj => obj.name === "CAN_EDIT_INVOICE" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
      const selected = currentItems[index];
      dispatch({ type: 'SET_INVOICE_VIEW_DATA', payload: selected });
      openPopup();
    }
    else {
      toast.error("You are not allowed to update an invoice");
    }
  };

  const handleDeleteInvoice = async (index) => {
    if (state.userInfo.Permission.some(obj => obj.name === "CAN_DELETE" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
      // const confirmed = await confirm("Do you really want to delete this invoice?");
      // if (!confirmed) return;

      const result = await confirmDeleteInvoice();
      if (result === null) return;

      const invoice = invoices[index];
      if (result === "Void" && invoice.paymentStatus === "Void") {
        showToastMessage('info', "Invoice is already voided");
        return;
      }
      if (result === "Refund" && invoice.paymentStatus === "Refund") {
        showToastMessage('info', "Invoice is already refunded");
        return;
      }

      const updatedInvoices = invoices?.filter((_, rowIndex) => rowIndex !== index);
      const deletedInvoiceId = invoices?.find((_, rowIndex) => rowIndex === index);
      setInvoices(updatedInvoices);
      try {
        const res = await softDelInvoice(deletedInvoiceId['id'], result, state.userToken);
        // const res = await delInvoice(deletedInvoiceId['id'], state.userToken);
        const invoice = await res.json();
        if (res.status === 200) {
          showToastMessage('success', invoice.message)
        }
        else if (res.status === 404) {
          showToastMessage('info', invoice.message)
        }
        else if (res.status === 409) {
          showToastMessage('info', invoice.message)
        }
        setRefresh(!refresh);
      } catch (error) {
        console.log(error)
        showToastMessage('error', "Something went wrong");
      }
    }
    else {
      toast.error("You are not allowed to delete an invoice");
    }
  };

  const showCustomer = (index) => {
    const selected = currentItems[index];
    setIsCustomerFormOpen(true);
    setSelectedCustomer(selected.Customer);
  }

  const formatCreatedAt = (createdAt) => {
    const date = new Date(createdAt);
    return date.toLocaleString();
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;

  let currentItems = [];
  let filteredRows = [];
  if (invoices?.length !== 0) {
    filteredRows = invoices?.filter(
      ({ Customer }) =>
        Customer['firstName'].toLowerCase().includes(searchQuery.toLowerCase()) ||
        Customer['lastName'].toLowerCase().includes(searchQuery.toLowerCase())
    );
    currentItems = filteredRows.slice(indexOfFirstItem, indexOfLastItem);
  }

  const handleItemsPerPageChange = (event) => {
    const selectedItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(selectedItemsPerPage);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const openPopup = () => {
    if (state.userInfo.Permission.some(obj => obj.name === "CAN_CREATE_INVOICE" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
      dispatch({ type: 'SET_INVOICE_FORM', payload: true });
      setIsFormOpen(true);
    }
    else {
      toast.error("You are not allowed to add an invoice");
    }
  };

  if (loading) {
    return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-gray-900/50" />
  }
  return (
    <>
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-4 sm:mb-0 flex items-center">
            <Typography variant="h5" color="blue-gray" className="flex items-center">
              <DocumentTextIcon className="h-12 w-12 text-blueGray-500 ml-2" />
              Invoices
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
                <Button className="w-full bg-blue-900 lg:w-auto" size="md" onClick={openPopup}>
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
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head) => (
                  <th key={head} className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices?.map(({ id, invoiceNumber, Customer, paymentStatus, totalAmount, createdAt, CustomerVehicle }, index) => {
                const isLast = index === invoices.length - 1;
                const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
                return (
                  <tr key={id}>
                    <td className={classes}>
                      <Link
                        to="#"
                        className="text-blue-gray font-normal hover:underline"
                        onClick={() => handleEditInvoice(index)}
                      >
                        INV{`${invoiceNumber}`.padStart(4, '0')}
                      </Link>
                    </td>
                    <td className={classes}>
                      <Link
                        to="#"
                        className="text-blue-gray font-normal hover:underline"
                        onClick={() => showCustomer(index)}
                      >
                        {Customer['firstName']} {Customer['lastName']}
                      </Link>
                    </td>
                    <td className={classes}>
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {totalAmount}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color={
                          paymentStatus === "Paid"
                            ? "green"
                            : paymentStatus === "Partially Paid"
                              ? "orange"
                              : "red"
                        }
                        className="font-normal"
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
                        <IconButton variant="text" onClick={() => handleDeleteInvoice(index)}>
                          <TrashIcon className="h-6 w-6 text-red-500" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>

        <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
          <Typography variant="small" color="blue-gray" className="font-normal">
            Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </Typography>
          <Typography variant="small" color="blue-gray" className="font-normal">
            Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
          </Typography>
          <div className="flex gap-2">
            <Button variant="outlined" size="sm" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>
              Previous
            </Button>
            <Button
              variant="outlined"
              size="sm"
              disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
              onClick={() => paginate(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      <CustomerForm open={isCustomerFormOpen} close={() => setIsCustomerFormOpen(false)} refresh={refresh} setRefresh={setRefresh} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />
      <MyPopUpForm refresh={refresh} setRefresh={setRefresh} open={isFormOpen} close={() => { setIsFormOpen(false); dispatch({ type: 'SET_INVOICE_FORM', payload: false }) }} />
    </>
  );
}   