import React, { useState } from "react";
import PrintView from "./printView";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import ReactToPrint from "react-to-print";
import { updateQuotation } from "@/services/updateQuotation";
import { delQuotation } from "@/services/delQuotaion";
import { addInvoice } from "@/services/addInvoice";
import { useNavigate } from "react-router-dom";
import { addQuotaion } from "@/services/addQuotation";
import { sendMail } from "@/services/sendMail";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import NotesForm from "../quotation/notesForm";
import { useConfirm } from "@/context/confirmContext";
import { Printer, Send, Edit, FileText, Trash2, Check, BookCopy, Copy, FileCheck } from "lucide-react"
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { Spinner } from "@material-tailwind/react";

const ViewQuotation = ({ quotationData, setQuotationData, componentRef, appliedTaxes, setEdit, close }) => {
    const confirm = useConfirm();
    const router = useNavigate();
    const { state, dispatch } = State();
    const [isLoading, setIsLoading] = React.useState({
        delete: false,
        createInvoice: false,
        createCopy: false,
        sendMail: false,
        approve: false
    });
    const [isNotesFormOpen, setIsNotesFormOpen] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    // Delete Invoice
    const handleDel = async () => {
        const confirmed = await confirm("Do you really want to delete this quotation?");
        if (!confirmed) return;
        setIsLoading({ ...isLoading, delete: true });
        try {
            const res = await delQuotation(quotationData.id, state.userToken);
            const quotation = await res.json();
            if (res.status === 200) {
                toast.success(quotation.message)
            }
            else if (res.status === 404) {
                toast.info(quotation.message)
            }
        } catch (error) {
            console.log(error)
            toast.error("Something went wrong");
        }
        setIsLoading({ ...isLoading, delete: false });
        close();
    }

    const setQuotationApproved = async () => {
        const confirmed = await confirm("Do you really want to approve this quotation? You won't be able to edit it after this.");
        if (!confirmed) return;
        setIsLoading({ ...isLoading, approve: true });

        try {
            const res = await updateQuotation(quotationData.id, { quotationData: { approved: true }, products: [] }, state.userToken);
            const quotation = await res.json();
            if (res.status === 200) {
                setQuotationData(quotation.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading({ ...isLoading, approve: false });
        }
    }

    const createInvoice = async () => {
        const confirmed = await confirm("Do you really want to create an invoice from this quotation?");
        if (!confirmed) return;
        setIsLoading({ ...isLoading, createInvoice: true });
        const selectedProductIds = quotationData?.Product?.map((product) => ({
            id: product.id,
            quantity: product.quotation_product.quantity,
            description: product.quotation_product.description || '',
            price: product.quotation_product.price
        })).filter(product => product.id);

        const data = {
            invoiceData: {
                totalAmount: quotationData.totalAmount,
                CustomerId: quotationData.CustomerId,
                CustomerVehicleId: quotationData.CustomerVehicleId,
                comments: quotationData.comments,
                notes: quotationData.notes,
                discount: quotationData.discount,
                BusinessId: state.business.id
            },
            "products": selectedProductIds,
        };

        try {
            const res = await addInvoice(data, state.userToken)
            const invoice = await res.json();
            if (res.status === 200) {
                toast.success(invoice.message);
                dispatch({ type: 'SET_INVOICE_VIEW_DATA', payload: invoice.data });
                dispatch({ type: 'SET_INVOICE_VIEW', payload: true });
                dispatch({ type: 'SET_INVOICE_FORM', payload: true });
                dispatch({ type: 'SET_QUOTATION_VIEW', payload: false });
                router('/dashboard/invoice');
            }
            else if (res.status === 404) {
                toast.info(invoice.message)
            }
        } catch (error) {
            console.log(error);
        }
        setIsLoading({ ...isLoading, createInvoice: false });
    };

    const createCopy = async () => {
        setIsLoading({ ...isLoading, createCopy: true });
        const selectedProductIds = quotationData?.Product?.map((product) => ({
            id: product.id,
            quantity: product.quotation_product.quantity,
            description: product.quotation_product.description || '',
            price: product.quotation_product.price
        })).filter(product => product.id);

        const data = {
            quotationData: {
                totalAmount: quotationData.totalAmount,
                comments: quotationData.comments,
                notes: quotationData.notes,
                discount: quotationData.discount,
                CustomerId: quotationData.CustomerId,
                CustomerVehicleId: quotationData.CustomerVehicleId,
                BusinessId: state.business.id,
            },
            "products": selectedProductIds,
        };
        try {
            const res = await addQuotaion(data, state.userToken);
            const quotation = await res.json();
            if (res.status === 200) {
                toast.success(quotation.message);
                setQuotationData(quotation.data);
            }
            else if (res.status === 409) {
                toast.error(quotation.message)
            }
        } catch (error) {
            console.log(error);
        }
        setIsLoading({ ...isLoading, createCopy: false });
    }

    const sendMailToUser = async () => {
        setIsLoading({ ...isLoading, sendMail: true });
        try {
            const quotationElement = componentRef.current;
            if (!quotationElement) return;

            const scale = 2.0;
            const a4WidthPx = 794;
            const a4HeightPx = 1123;
            const canvas = await html2canvas(quotationElement, {
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
            formData.append("pdf", pdfBlob, "quotation.pdf");
            formData.append("businessName", state?.business?.name);
            formData.append("businessEmail", state?.business?.email);
            formData.append("customerEmail", quotationData?.Customer?.email);
            formData.append("customerName", `${quotationData?.Customer?.firstName} ${quotationData?.Customer?.lastName}`);

            const res = await sendMail(formData, 'quotation');
            const data = await res.json();
            if (res.status === 200) {
                toast.success(data.message);
            }
            else {
                toast.error(data.message);
            }
            close();
        } catch (error) {
            console.log(error);
        }
        setIsLoading({ ...isLoading, sendMail: false });
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Balance Due */}
            <div className="text-center py-4 border-b border-gray-600">
                <h2 className="text-lg font-normal text-gray-400 mb-1">Total Amount</h2>
                <h5 className="text-3xl lg:text-4xl text-white font-normal">${(quotationData?.totalAmount).toFixed(2)}</h5>
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
                    {!isLoading.approve ?
                        <button type="button" disabled={!state.userInfo.Permission.includes("quote:update")} onClick={() => !quotationData?.approved && setQuotationApproved()} className={`flex items-center gap-2 w-full p-3 mx-auto ${!quotationData?.approved ? "hover:bg-gradient-to-br from-gray-700 to-gray-600" : "text-green-500 font-bold"} ${state.userInfo?.Permission.includes("quote:update") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><FileCheck className="w-5 h-5 inline-block mr-1" />{!quotationData?.approved ? 'Approve' : 'Approved'}</button>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }
                    {/* {!quotationData?.approved && ( */}
                    <button type="button" disabled={!state.userInfo.Permission.includes("quote:update")} onClick={() => { dispatch({ type: 'SET_QUOTATION_VIEW', payload: false }); setEdit(true) }} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("quote:update") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><Edit className="w-5 h-5 inline-block mr-1" />Edit</button>
                    {/* )} */}
                    <button type="button" disabled={!state.userInfo.Permission.includes("quote:update")} onClick={() => setIsNotesFormOpen(true)} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("quote:update") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><FileText className="w-5 h-5 inline-block mr-1" />Notes</button>
                    {!isLoading.delete ?
                        <button type="button" disabled={!state.userInfo.Permission.includes("quote:delete")} onClick={handleDel} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("quote:delete") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><Trash2 className="w-5 h-5 inline-block mr-1" />Delete</button>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }

                    {!isLoading.createInvoice ?
                        <button type="button" disabled={!state.userInfo.Permission.includes("invoice:create")} onClick={createInvoice} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("invoice:create") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                            <BookCopy className="w-5 h-5 inline-block mr-1" />
                            Create Invoice
                        </button>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }

                    {!isLoading.createCopy ?
                        <button type="button" disabled={!state.userInfo.Permission.includes("quote:create")} onClick={createCopy} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("quote:create") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                            <Copy className="w-5 h-5 inline-block mr-1" />
                            Create Duplicate
                        </button>
                        :
                        <div className="flex items-center justify-center h-fit py-2.5">
                            <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    }
                    {/* print Btn */}
                    <ReactToPrint
                        trigger={() => <button
                            className="flex items-center gap-2 w-full p-3 text-left mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer"
                            type="button"
                        >
                            <Printer className="w-5 h-5 inline-block mr-1" />
                            Print
                        </button>}
                        content={() => componentRef.current}
                    />
                </div>
            </div>
        </div>
    )

    return (
        <>
            <div className="h-[70vh] lg:h-[90vh] overflow-hidden">
                <div className="hidden lg:flex h-full">
                    <div className="flex-1 overflow-x-auto overflow-y-auto p-2">
                        <div className="max-h-[88vh] mx-auto">
                            {quotationData && Object.keys(quotationData).length > 0 ? <PrintView view={true} quotationData={quotationData} ref={componentRef} appliedTaxes={appliedTaxes} /> : null}
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
                            <h2 className="text-sm font-normal text-gray-400">Total Amount</h2>
                            <h5 className="text-xl text-white font-normal">
                                ${(quotationData?.totalAmount).toFixed(2)}
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
                                {quotationData && Object.keys(quotationData).length > 0 ? (
                                    <PrintView view={true} quotationData={quotationData} ref={componentRef} appliedTaxes={appliedTaxes} />
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
            <NotesForm open={isNotesFormOpen} close={() => setIsNotesFormOpen(false)} quotationId={quotationData?.id} setQuotationData={setQuotationData} currentValue={quotationData.notes} />
        </>
    );
}
export default ViewQuotation;