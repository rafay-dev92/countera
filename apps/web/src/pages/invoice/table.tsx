import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,

  Typography,
  Button,
  CardBody,
  CardFooter,
  IconButton,
  Tooltip,
  Spinner,
} from "@material-tailwind/react";
import { Input } from "@/widgets/mt";
import { TrashIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { StatusChip } from "@/widgets/status-chip";
import MyPopUpForm from "./form";
import { fetchInvoices } from "@/services/fetchInvoices";
import { delInvoice } from "@/services/delInvoice";
import { Link } from "react-router-dom";
import { State } from "../../state/Context";
import { toast } from "react-toastify";
import { softDelInvoice } from "@/services/softDelInvoice";
import { useDeleteInvoiceConfirm } from "@/context/deleteInvoiceConfirmContext";
import CustomerForm from "./customerForm";
import type { Customer, Invoice as InvoiceType, Paginated } from "@/types/api";

const TABLE_HEAD = ["Invoice", "Customer", "Total", "Status", "Invoice Date", "Vehicle", "Archived", ""];

export function Invoice() {
  const confirmDeleteInvoice = useDeleteInvoiceConfirm();
  const { state, dispatch } = State();
  const [searchQuery, setSearchQuery] = useState<string | null>("");
  const [debouncedTerm, setDebouncedTerm] = useState<string | null>(searchQuery);
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.trim() === "") {
      setSearchQuery(null)
    } else {
      setSearchQuery(value);
    }
  };

  const getInvoices = async () => {
    try {
      const filters: { paymentStatus: string[]; CustomerDetails?: { name: string } } = {
        paymentStatus: ["PAID", "PARTIALLY_PAID", "UNPAID", "VOIDED", "REFUNDED"]
      };

      if (searchQuery && searchQuery.trim()) {
        filters.CustomerDetails = { name: searchQuery };
      }
      const response = (await fetchInvoices(state.userToken, currentPage, itemsPerPage, filters))!;
      const totalInvoices: Paginated<InvoiceType> = await response.json();
      setInvoices(totalInvoices?.data)

      setTotalCount(totalInvoices.total || 0);
    } catch (error: any) {
      console.log(error.message);
      showToastMessage('error', "Something went wrong");
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
    getInvoices();
  }, [refresh, currentPage, itemsPerPage, debouncedTerm]);

  const handleEditInvoice = (index: number) => {
    const selected = invoices[index];
    dispatch({ type: 'SET_INVOICE_VIEW_DATA', payload: selected });
    openPopup();
  };

  const handleDeleteInvoice = async (index: number) => {

    const result = await confirmDeleteInvoice();
    if (result === null) return;

    const invoice = invoices[index];
    if (invoice.paymentStatus === "VOIDED" || invoice.paymentStatus === "REFUNDED") {
      showToastMessage('info', `Invoice is already ${invoice.paymentStatus.toLowerCase()}`);
      return;
    }

    const updatedInvoices = invoices?.filter((_, rowIndex) => rowIndex !== index);
    const deletedInvoiceId = invoices?.find((_, rowIndex) => rowIndex === index);
    setInvoices(updatedInvoices);
    try {
      const res = (await softDelInvoice(deletedInvoiceId!['id'], result, state.userToken))!;
      // const res = await delInvoice(deletedInvoiceId['id'], state.userToken);
      const invoice = await res.json();
      if (res.status === 200) {
        showToastMessage('success', invoice.message)
      }
      else if (res.status === 403) {
        showToastMessage('info', invoice.message)
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
  };

  const showCustomer = (index: number) => {
    const selected = invoices[index];
    setIsCustomerFormOpen(true);
    setSelectedCustomer(selected.Customer);
  }

  const formatCreatedAt = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleString();
  };

  // let filteredRows = [];
  // if (invoices?.length !== 0) {
  //   filteredRows = invoices?.filter(
  //     ({ Customer }) =>
  //       Customer['firstName'].toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       Customer['lastName'].toLowerCase().includes(searchQuery.toLowerCase())
  //   );
  // }

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(selectedItemsPerPage);
    setCurrentPage(1);
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const openPopup = () => {
    dispatch({ type: 'SET_INVOICE_FORM', payload: true });
    setIsFormOpen(true);
  };

  if (loading) {
    return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-slate-400" />
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Invoices</h1>
        <Button
          disabled={!state.userInfo?.Permission?.includes("invoice:create")}
          className="flex items-center gap-1.5 bg-teal-700 px-3.5 py-2 text-[13px] font-medium normal-case shadow-none hover:bg-teal-800 hover:shadow-none"
          onClick={openPopup}
        >
          <PlusIcon className="h-4 w-4" />
          New invoice
        </Button>
      </div>
      <Card className="h-full w-full rounded-lg border border-slate-200 shadow-none">
        <CardHeader floated={false} shadow={false} className="m-0 rounded-none rounded-t-lg px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="w-full lg:w-80">
              <Input
                label="Search by customer"
                value={searchQuery as any}
                onChange={handleSearchChange}
                icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center lg:ml-auto">
              <Typography variant="small" color="blue-gray" className="mr-2 text-[13px]">
                Rows per page
              </Typography>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[13px] text-slate-700"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head, headIndex) => (
                  <th
                    key={headIndex}
                    className={`border-y border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-slate-500 ${head === "Total" ? "text-right" : ""}`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices?.map(({ id, invoiceNumber, Customer, paymentStatus, totalAmount, createdAt, CustomerVehicle, isArchived }, index) => {
                const classes = "px-4 py-3 border-b border-slate-100 text-[13.5px]";
                return (
                  <tr key={id} className="hover:bg-slate-50/60">
                    <td className={classes}>
                      <Link
                        to="javascript:void(0)"
                        className="font-medium text-teal-700 tabular-nums hover:underline"
                        onClick={() => handleEditInvoice(index)}
                      >
                        INV{`${invoiceNumber}`.padStart(4, '0')}
                      </Link>
                    </td>
                    <td className={classes}>
                      <Link
                        to="#"
                        className="text-slate-700 hover:underline"
                        onClick={() => showCustomer(index)}
                      >
                        {Customer['firstName']} {Customer['lastName']}
                      </Link>
                    </td>
                    <td className={`${classes} text-right tabular-nums text-slate-900`}>
                      {totalAmount != null && (totalAmount as any) !== "" && !Number.isNaN(Number(totalAmount))
                        ? `$${Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : totalAmount}
                    </td>
                    <td className={classes}>
                      <StatusChip status={paymentStatus} />
                    </td>
                    <td className={`${classes} text-slate-500`}>
                      {formatCreatedAt(createdAt)}
                    </td>
                    <td className={`${classes} text-slate-500`}>
                      {`${CustomerVehicle['make']} ${CustomerVehicle['model']} ${CustomerVehicle['year']}`}
                    </td>
                    <td className={`${classes} text-slate-500`}>
                      {isArchived ? "Yes" : "—"}
                    </td>
                    <td className={classes}>
                      <Tooltip content="Delete invoice">
                        <IconButton variant="text" size="sm" onClick={() => handleDeleteInvoice(index)}>
                          <TrashIcon className="h-[18px] w-[18px] text-slate-400 hover:text-red-600" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>

        <CardFooter className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <Typography variant="small" color="blue-gray" className="text-[13px] tabular-nums">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </Typography>
          <div className="flex items-center gap-3">
            <Typography variant="small" color="blue-gray" className="text-[13px] tabular-nums">
              Page {currentPage} of {Math.max(1, Math.ceil(totalCount / itemsPerPage))}
            </Typography>
            <div className="flex gap-2">
              <Button variant="outlined" size="sm" className="border-slate-300 text-slate-700 normal-case" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>
                Previous
              </Button>
              <Button
                variant="outlined"
                size="sm"
                className="border-slate-300 text-slate-700 normal-case"
                disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                onClick={() => paginate(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <CustomerForm open={isCustomerFormOpen} close={() => setIsCustomerFormOpen(false)} refresh={refresh} setRefresh={setRefresh} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />
      <MyPopUpForm refresh={refresh} setRefresh={setRefresh} open={isFormOpen} close={() => { setIsFormOpen(false); dispatch({ type: 'SET_INVOICE_FORM', payload: false }) }} />
    </>
  );
}   