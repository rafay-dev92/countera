import React, { useEffect, useState } from "react";
import PrintView from "./printView";
import { delInvoice } from "@/services/delInvoice";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import PaymentForm from "./paymentForm";
import { updateInvoice } from "@/services/updateInvoice";
import ReactToPrint from "react-to-print";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { sendMail } from "@/services/sendMail";
import NotesForm from "./notesForm";
import { useConfirm } from "@/context/confirmContext";
import { useDeleteInvoiceConfirm } from "@/context/deleteInvoiceConfirmContext";
import { softDelInvoice } from "@/services/softDelInvoice";
import { Dialog, Spinner } from '@material-tailwind/react'
import { format } from 'date-fns';
import { fetchInvoiceAudits } from "@/services/fetchInvoiceAudit";
import { ArrowLongRightIcon, XCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
import { Printer, Send, Edit, FileText, Trash2, CreditCard, History } from "lucide-react"
import { PaymentStatus } from "@/utils/enums/paymentStatuses";

const ViewInvoice = ({ printInvoice, setPrintInvoice, componentRef, appliedTaxes, setEdit, close }) => {
    const confirm = useConfirm();
    const confirmDeleteInvoice = useDeleteInvoiceConfirm();
    const { state, dispatch } = State();
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    const [isNotesFormOpen, setIsNotesFormOpen] = useState(false);
    const [totalAmountPaid, setTotalAmountPaid] = useState(0);
    const [isLoading, setIsLoading] = React.useState({
        delete: false,
        sendMail: false,
        audit: false,
    });
    const [showVersionsModal, setShowVersionsModal] = useState(false);
    const [auditTrail, setAuditTrail] = useState([]);

    const [isOpen, setIsOpen] = useState(false);

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

    const handleUpdate = async () => {
        if (printInvoice.paymentStatus !== 'PAID') {
            dispatch({ type: 'SET_INVOICE_VIEW', payload: false });
            setEdit(true);
        }
        else {
            const decision = await confirm('This invoice is Paid, would you still want to update it?');
            if (!decision) return;

            dispatch({ type: 'SET_INVOICE_VIEW', payload: false });
            setEdit(true);
        }
    }

    const handleDel = async () => {
        const result = await confirmDeleteInvoice();
        if (result === null) return;

        setIsLoading({ ...isLoading, delete: true });
        if (printInvoice.paymentStatus === "VOIDED" || printInvoice.paymentStatus === "REFUNDED") {
            showToastMessage('info', `Invoice is already ${printInvoice.paymentStatus.toLowerCase()}`);
            return;
        }
        try {
            const res = await softDelInvoice(printInvoice.id, result, state.userToken);
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
        } catch (error) {
            console.log(error)
            showToastMessage('error', "Something went wrong");
        }
        setIsLoading({ ...isLoading, delete: false });
        close();
    }

    const setInvoiceStatus = async (id, status) => {
        try {
            const res = await updateInvoice(id, { invoiceData: { paymentStatus: status }, products: [] }, state.userToken);
            const invoice = await res.json();
            if (res.status === 200) {
                setPrintInvoice(invoice.data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const sendMailToUser = async () => {
        setIsLoading({ ...isLoading, sendMail: true });
        try {
            const invoiceElement = componentRef.current;
            if (!invoiceElement) return;

            const scale = 2.0;
            const a4WidthPx = 794;
            const a4HeightPx = 1123;
            const canvas = await html2canvas(invoiceElement, {
                scale,
                width: a4WidthPx,
                height: a4HeightPx,
                useCORS: true,
                backgroundColor: "#fff"
            });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            const pdfBlob = pdf.output("blob");

            const formData = new FormData();
            formData.append("pdf", pdfBlob, "invoice.pdf");
            formData.append("businessName", state?.business?.name);
            formData.append("businessEmail", state?.business?.email);
            formData.append("customerEmail", printInvoice?.Customer?.email);
            formData.append("customerName", `${printInvoice?.Customer?.firstName} ${printInvoice?.Customer?.lastName}`);

            const res = await sendMail(formData, 'invoice');
            const data = await res.json();
            if (res.status === 200) toast.success(data.message);
            else if (res.status === 400) toast.info(data.message);
            else toast.error(data.message);
            close();
        } catch (error) {
            console.log(error);
        }
        setIsLoading({ ...isLoading, sendMail: false });
    }

    // useEffect(() => {
    //     if (Object.keys(printInvoice).length > 0 && printInvoice?.Payments.length > 0) {
    //         const paidAmount = printInvoice?.Payments.reduce((acc, payment) => acc + payment.paidAmount, 0);
    //         if (paidAmount !== totalAmountPaid) {
    //             setTotalAmountPaid(paidAmount);
    //             if (paidAmount === printInvoice?.totalAmount && printInvoice?.paymentStatus !== PaymentStatus.PAID) {
    //                 setInvoiceStatus(printInvoice?.id, PaymentStatus.PAID);
    //             }
    //             else if (paidAmount > 0 && paidAmount < printInvoice?.totalAmount && printInvoice?.paymentStatus !== PaymentStatus.PARTIALLY_PAID) {
    //                 setInvoiceStatus(printInvoice?.id, PaymentStatus.PARTIALLY_PAID);
    //             }
    //         }
    //     }
    // }, [printInvoice])

    const fetchAuditTrail = async () => {
        try {
            setIsLoading({ ...isLoading, audit: true });
            const response = await fetchInvoiceAudits(printInvoice.id, state.userToken);
            if (response.status === 200) {
                setAuditTrail(response.data);
            } else {
                setAuditTrail([]);
                toast.error(response.message || 'Failed to fetch invoice versions');
            }
        } catch (error) {
            console.error('Error fetching audit trail:', error);
            setAuditTrail([]);
            toast.error('Unable to load invoice versions. Please try again later.');
        } finally {
            setIsLoading({ ...isLoading, audit: false });
        }
    };

    const handleVersionsClick = () => {
        setShowVersionsModal(true);
        fetchAuditTrail();
    };

    // Helper function to format value for display
    const formatValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'object') {
            if (value.field && value.value) {
                console.log(value)
                const fieldName = value.field.includes('_') ? value.field.split('_')[0] : value.field;
                if (typeof value.value === 'object' && value.value !== null) {
                    const nestedChanges = Object.entries(value.value)
                        .map(([key, val]) => `${formatFieldName(key)}: ${formatValue(val)}`)
                        .join(', ');
                    return `${fieldName} : { ${nestedChanges} }`;
                }
                return `${fieldName} : ${formatValue(value.value)}`;
            }
            return JSON.stringify(value.name);
        }
        return value;
    };

    // Helper function to format field name for display
    const formatFieldName = (field) => {
        return field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ');
    };

    const renderAuditChange = (audit) => {
        const oldValue = JSON.parse(audit.oldValue);
        const newValue = JSON.parse(audit.newValue);

        // Get user info
        const userName = audit.User ? `${audit.User.first_name} ${audit.User.last_name}` : 'Unknown User';
        const userRole = audit.User?.role || 'Unknown Role';

        // Format the change type for display
        const changeTypeMap = {
            'UPDATE': 'Updated',
            'ADD': 'Added',
            'REMOVE': 'Removed',
            'UPDATE_ADD': 'Updated and Added',
            'UPDATE_REMOVE': 'Updated and Removed',
            'ADD_REMOVE': 'Added and Removed',
            'MULTIPLE': 'Multiple Changes'
        };

        const changeType = changeTypeMap[audit.changeType] || audit.changeType;

        if (audit.fieldName.startsWith('product_')) {
            const productName = audit.fieldName.split('_')[1];
            const field = audit.fieldName.split('_')[2];

            if (field === 'price' || field === 'quantity' || field === 'description') {
                return (
                    <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <span>{userName}</span>
                            <span className="px-2 py-0.5 bg-gray-700 rounded-full text-[10px]">{userRole}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-400">{formatFieldName(audit.fieldName)}</span>
                            <span className="text-gray-400">•</span>
                            {!oldValue[audit.fieldName]?.[field] && newValue[audit.fieldName]?.[field] && (
                                <span className="text-green-400">{newValue[audit.fieldName]?.[field] !== '' ? formatValue(newValue[audit.fieldName][field]) : <span className="flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Empty</span>}</span>
                            )}
                            {oldValue[audit.fieldName]?.[field] && newValue[audit.fieldName]?.[field] && (
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">{!oldValue[audit.fieldName]?.[field] !== '' ? formatValue(oldValue[audit.fieldName][field]) : <span className="flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Empty</span>}</span>
                                    <ArrowLongRightIcon className="text-gray-400 w-4 h-4" />
                                    <span className="text-red-400">{!newValue[audit.fieldName]?.[field] !== '' ? formatValue(newValue[audit.fieldName][field]) : <span className="flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Empty</span>}</span>
                                </div>
                            )}
                            <span className="text-xs px-2 py-1 rounded bg-gray-700">
                                {!oldValue[audit.fieldName]?.[field] ? "Added" : !newValue[audit.fieldName]?.[field] ? "Deleted" : "Updated"}
                            </span>
                        </div>
                    </div>
                );
            }
        }

        const renderObjectChanges = (oldObj, newObj) => {
            return Object.entries(oldObj).map(([field, oldVal]) => {
                const newVal = newObj[field];
                if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

                return (
                    <div key={field} className="flex items-center gap-2 ml-4">
                        <span className="font-semibold text-blue-400">{formatFieldName(field)}</span>
                        <span className="text-gray-400">•</span>
                        {oldVal && newVal ? (
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">{formatValue(oldVal) ? formatValue(oldVal) : oldVal[field.split('_')[2]] !== '' ? `${oldVal[field.split('_')[2]]}` : <span className="flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Empty</span>}</span>
                                <ArrowLongRightIcon className="text-gray-400 w-4 h-4" />
                                <span className="text-red-400">{formatValue(newVal) ? formatValue(newVal) : newVal[field.split('_')[2]] !== '' ? `${newVal[field.split('_')[2]]}` : <span className="flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Empty</span>}</span>
                            </div>)
                            : null
                        }
                        {!oldVal && newVal && (
                            typeof newVal === 'object' ? Object.keys(newVal).map(key => (
                                key !== 'id' && (
                                    <span key={key} className="text-green-400">{newVal[key] && `${key} : ${newVal[key]}`}</span>
                                )
                            ))
                                :
                                <span className="text-green-400">{newVal !== '' ? formatValue(newVal) : <span className="flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Empty</span>}</span>
                        )}
                        <span className="text-xs px-2 py-1 rounded bg-gray-700">
                            {!oldVal ? "Added" : !newVal ? "Deleted" : "Updated"}
                        </span>
                    </div>
                );
            }).filter(Boolean);
        };

        return (
            <div className="text-sm space-y-1">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <span>{userName}</span>
                    <span className="px-2 py-0.5 bg-gray-700 rounded-full text-[10px]">{userRole}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-blue-400">{formatFieldName(audit.fieldName)}</span>
                    {renderObjectChanges(oldValue, newValue)}
                </div>
            </div>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Balance Due */}
            <div className="text-center py-4 border-b border-gray-600">
                <h2 className="text-lg font-normal text-gray-400 mb-1">Balance Due</h2>
                <h5 className="text-3xl lg:text-4xl text-white font-normal">${(printInvoice?.totalAmount - printInvoice.paidAmount).toFixed(2)}</h5>
            </div>

            <div className="flex flex-col items-center justify-start h-full w-full">
                <div className="text-white w-full text-left font-medium">
                    {!isLoading.sendMail ?
                        <div onClick={sendMailToUser} className="flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer"><Send className="w-5 h-5 inline-block mr-1" />Send</div>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }
                    {printInvoice?.paymentStatus !== 'VOIDED' && printInvoice?.paymentStatus !== 'REFUNDED' && (
                        <div>
                            <button type="button" disabled={!state.userInfo.Permission.includes("invoice:update")} onClick={() => printInvoice?.paymentStatus !== 'PAID' && setIsPaymentFormOpen(true)} className={`flex items-center gap-2 w-full p-3 mx-auto ${printInvoice?.paymentStatus !== 'PAID' ? "hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer" : "text-green-500 font-bold cursor-not-allowed"} ${state.userInfo?.Permission.includes("quote:update") ? "" : "cursor-not-allowed opacity-50"}`}><CreditCard className="w-5 h-5 inline-block mr-1" />{printInvoice?.paymentStatus !== 'PAID' ? 'PAY' : 'PAID'}</button>
                            <button type="button" onClick={handleUpdate} disabled={!state.userInfo?.Permission.includes("invoice:update")} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("invoice:update") ? "" : "cursor-not-allowed opacity-50"}`}><Edit className="w-5 h-5 inline-block mr-1" />Edit</button>
                            <button type="button" onClick={() => setIsNotesFormOpen(true)} disabled={!state.userInfo?.Permission.includes("invoice:update")} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("invoice:update") ? "" : "cursor-not-allowed opacity-50"}`}><FileText className="w-5 h-5 inline-block mr-1" />Notes</button>
                            {!isLoading.delete ?
                                <button type="button" onClick={handleDel} disabled={!state.userInfo?.Permission.includes("invoice:delete")} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("invoice:delete") ? "" : "cursor-not-allowed opacity-50"}`}><Trash2 className="w-5 h-5 inline-block mr-1" />Delete</button>
                                :
                                <div className="flex items-center p-3">
                                    <Spinner className="h-6 w-6 text-gray-400/50" />
                                </div>
                            }
                        </div>
                    )}
                    <ReactToPrint
                        trigger={() => <button
                            className="flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer text-left"
                            type="button"
                        >
                            <Printer className="w-5 h-5 inline-block mr-1" />
                            Print
                        </button>}
                        content={() => componentRef.current}
                    />
                    <button type="button" disabled={!state.userInfo?.Permission.includes("invoice:update")} className={`flex items-center gap-2 w-full p-3 text-blue-300 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("invoice:update") ? "" : "cursor-not-allowed opacity-50"}`} onClick={handleVersionsClick}>
                        <History className="w-5 h-5 inline-block mr-1" />
                        Versions
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <>
            <div className="h-[70vh] lg:h-[90vh] overflow-hidden">
                {/* Desktop Layout */}
                <div className="hidden lg:flex h-full">
                    {/* Main Content */}
                    <div className="flex-1 overflow-x-auto overflow-y-auto p-2">
                        <div className="max-h-[68vh] lg:max-h-[88vh] mx-auto">
                            {printInvoice && Object.keys(printInvoice).length > 0 ? (
                                <PrintView view={true} printInvoice={printInvoice} ref={componentRef} appliedTaxes={appliedTaxes} />
                            ) : null}
                        </div>
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="w-64 bg-gradient-to-br from-gray-800 to-gray-700">
                        <SidebarContent />
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden h-full flex flex-col relative overflow-hidden">
                    {/* Mobile Header with Menu */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-800 to-gray-700">
                        <div className="text-white">
                            <h2 className="text-sm font-normal text-gray-400">Balance Due</h2>
                            <h5 className="text-xl text-white font-normal">
                                ${(printInvoice?.paidAmount).toFixed(2)}
                            </h5>
                        </div>
                        <div>
                            <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-white bg-transparent p-2 rounded">
                                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Content Container */}
                    <div className="flex-1 relative overflow-hidden">
                        {/* Mobile Content - Horizontally Scrollable */}
                        <div
                            className={`absolute inset-0 overflow-x-auto overflow-y-auto p-2 transition-transform duration-300 ease-in-out ${isOpen ? "transform -translate-x-64" : "transform translate-x-0"}`}
                        >
                            <div className="min-w-[794px]">
                                {printInvoice && Object.keys(printInvoice).length > 0 ? (
                                    <PrintView view={true} printInvoice={printInvoice} ref={componentRef} appliedTaxes={appliedTaxes} />
                                ) : null}
                            </div>
                        </div>

                        {/* Mobile Sidebar */}
                        <div
                            className={`absolute top-0 right-0 w-64 h-full bg-gradient-to-br from-gray-800 to-gray-700 border-l border-gray-600 shadow-lg transition-transform duration-300 ease-in-out ${isOpen ? "transform translate-x-0" : "transform translate-x-full"}`}
                        >
                            <SidebarContent />
                        </div>
                    </div>
                </div>
            </div>

            <NotesForm open={isNotesFormOpen} close={() => setIsNotesFormOpen(false)} invoiceId={printInvoice?.id} setPrintInvoice={setPrintInvoice} currentValue={printInvoice?.notes} />
            <PaymentForm open={isPaymentFormOpen} close={() => setIsPaymentFormOpen(false)} totalAmount={printInvoice?.totalAmount} totalAmountPaid={printInvoice?.paidAmount} invoiceId={printInvoice?.id} setPrintInvoice={setPrintInvoice} />
            <Dialog
                open={showVersionsModal}
                handler={() => setShowVersionsModal(false)}
                className="bg-gray-900 text-white"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Invoice Versions</h3>
                        <button
                            onClick={() => setShowVersionsModal(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                        {isLoading.audit ? (
                            <div className="flex justify-center items-center p-4">
                                <Spinner className="mx-auto h-7 w-7 text-white" />
                            </div>
                        ) : auditTrail.length === 0 ? (
                            <div className="text-center p-4 text-gray-400">No version history available</div>
                        ) : (
                            <div className="space-y-4">
                                {auditTrail.map((audit, index) => (
                                    <div key={audit.id} className="border-b border-gray-700 pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-sm text-gray-400">
                                                {format(new Date(audit.createdAt), 'MMM dd, yyyy HH:mm')}
                                            </div>
                                        </div>
                                        {renderAuditChange(audit)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Dialog>
        </>
    );
}
export default ViewInvoice;