import React, { useState } from "react";
import PrintView from "./printView";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import ReactToPrint from "react-to-print";
import { updateWorkOrder } from "@/services/updateWorkOrder";
import { addInvoice } from "@/services/addInvoice";
import { useNavigate } from "react-router-dom";
import { sendMail } from "@/services/sendMail";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import NotesForm from "./notesForm";
import { useConfirm } from "@/context/confirmContext";
import { delWorkOrder } from "@/services/delWorkOrder";
import { addWorkOrder } from "@/services/addWorkOrder";
import { Printer, Edit, FileText, Trash2, CheckCheck, BookCopy, Copy } from "lucide-react"
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { Spinner } from "@material-tailwind/react";
import { WorkOrderStatus } from "@/utils/enums/workorderStatuses";

const ViewWorkOrder = ({ workOrderData, setWorkOrderData, componentRef, appliedTaxes, setEdit, close }) => {
    const confirm = useConfirm();
    const router = useNavigate();
    const { state, dispatch } = State();
    const [isLoading, setIsLoading] = React.useState({
        delete: false,
        createInvoice: false,
        createCopy: false,
        sendMail: false,
        finish: false
    });
    const [isNotesFormOpen, setIsNotesFormOpen] = useState(false);

    const [isOpen, setIsOpen] = useState(false);

    // Delete Invoice
    const handleDel = async () => {
        const confirmed = await confirm("Are you sure you want to delete this work order?");
        if (!confirmed) return;
        setIsLoading({ ...isLoading, delete: true });
        try {
            const res = await delWorkOrder(workOrderData.id, state.userToken);
            const workorder = await res.json();
            if (res.status === 200) {
                toast.success(workorder.message)
            }
            else if (res.status === 404) {
                toast.info(workorder.message)
            }
        } catch (error) {
            console.log(error)
            toast.error("Something went wrong");
        }
        setIsLoading({ ...isLoading, delete: false });
        close();
    }

    const setWorkOrderFinished = async () => {
        const confirmed = await confirm("Are you sure you want to finish this work order? You won't be able to edit it after this.");
        if (!confirmed) return;
        setIsLoading({ ...isLoading, finish: true });
        try {
            const res = await updateWorkOrder(workOrderData.id, { workOrderData: { status: 'Finished' }, products: [] }, state.userToken);
            const workorder = await res.json();
            if (res.status === 200) {
                setWorkOrderData(workorder.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading({ ...isLoading, finish: false });
        }
    }

    const createInvoice = async () => {
        const confirmed = await confirm("Are you sure you want to create an invoice for this work order?");
        if (!confirmed) return;
        setIsLoading({ ...isLoading, createInvoice: true });
        const selectedProductIds = workOrderData?.Product?.map((product) => ({
            id: product.id,
            quantity: product.workorder_product.quantity,
            description: product.workorder_product.description || '',
            price: product.workorder_product.price
        })).filter(product => product.id);

        const data = {
            invoiceData: {
                totalAmount: workOrderData.totalAmount,
                CustomerId: workOrderData.CustomerId,
                CustomerVehicleId: workOrderData.CustomerVehicleId,
                comments: workOrderData.comments,
                notes: workOrderData.notes,
                discount: workOrderData.discount,
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
                dispatch({ type: 'SET_WORKORDER_VIEW', payload: false });
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
        const selectedProductIds = workOrderData?.Product?.map((product) => ({
            id: product.id,
            quantity: product.workorder_product.quantity,
            description: product.workorder_product.description || '',
            price: product.workorder_product.price
        })).filter(product => product.id);

        const data = {
            workOrderData: {
                totalAmount: workOrderData.totalAmount,
                comments: workOrderData.comments,
                notes: workOrderData.notes,
                discount: workOrderData.discount,
                CustomerId: workOrderData.CustomerId,
                CustomerVehicleId: workOrderData.CustomerVehicleId,
                BusinessId: state.business.id,
            },
            "products": selectedProductIds,
        };
        try {
            const res = await addWorkOrder(data, state.userToken);
            const workorder = await res.json();
            if (res.status === 200) {
                toast.success(workorder.message);
                setWorkOrderData(workorder.data);
            }
            else if (res.status === 409) {
                toast.error(workorder.message)
            }
        } catch (error) {
            console.log(error);
        }
        setIsLoading({ ...isLoading, createCopy: false });
    }

    const sendMailToUser = async () => {
        setIsLoading({ ...isLoading, sendMail: true });
        try {
            const workorderElement = componentRef.current;
            if (!workorderElement) return;

            const canvas = await html2canvas(workorderElement, {
                scale: window.devicePixelRatio,
                useCORS: true
            });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            const pdfBlob = pdf.output("blob");

            const formData = new FormData();
            formData.append("pdf", pdfBlob, "workorder.pdf");
            formData.append("businessEmail", state?.business?.email);
            formData.append("customerEmail", workOrderData?.Customer?.email);
            formData.append("customerName", `${workOrderData?.Customer?.firstName} ${workOrderData?.Customer?.lastName}`);

            const res = await sendMail(formData, 'workorder');
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
                <h5 className="text-3xl lg:text-4xl text-white font-normal">${(workOrderData?.totalAmount).toFixed(2)}</h5>
            </div>

            <div className="flex flex-col items-center justify-start h-full w-full">
                <div className="text-white w-full text-left font-medium">
                    {!isLoading.finish ?
                        <button type="button" disabled={!state.userInfo.Permission.includes("workorder:update")} onClick={() => workOrderData?.status === WorkOrderStatus.PENDING && setWorkOrderFinished()} className={`flex items-center gap-2 w-full p-3 mx-auto ${workOrderData?.status === WorkOrderStatus.PENDING ? "hover:bg-gradient-to-br from-gray-700 to-gray-600" : "text-green-500 font-bold"} ${state.userInfo?.Permission.includes("workorder:update") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><CheckCheck className="h-5 w-5 inline-block mr-2" />{workOrderData?.status === WorkOrderStatus.PENDING ? 'Finish' : 'Finished'}</button>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }
                    {workOrderData?.status === WorkOrderStatus.PENDING && (
                        <button type="button" disabled={!state.userInfo.Permission.includes("workorder:update")} onClick={() => { dispatch({ type: 'SET_WORKORDER_VIEW', payload: false }); setEdit(true) }} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("workorder:update") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><Edit className="h-5 w-5 inline-block mr-2" />Edit</button>
                    )}
                    <button type="button" disabled={!state.userInfo.Permission.includes("workorder:update")} onClick={() => setIsNotesFormOpen(true)} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("workorder:update") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><FileText className="h-5 w-5 inline-block mr-2" />Notes</button>
                    {!isLoading.delete ?
                        <button type="button" disabled={!state.userInfo.Permission.includes("workorder:delete")} onClick={handleDel} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("workorder:delete") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}><Trash2 className="h-5 w-5 inline-block mr-2" />Delete</button>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }

                    {!isLoading.createInvoice ?
                        <button onClick={createInvoice} disabled={!state.userInfo?.Permission.includes("invoice:create")} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("invoice:create") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                            <BookCopy className="h-5 w-5 inline-block mr-2" />Create Invoice
                        </button>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }

                    {!isLoading.createCopy ?
                        <button type="button" disabled={!state.userInfo?.Permission.includes("workorder:create")} onClick={createCopy} className={`flex items-center gap-2 w-full p-3 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 ${state.userInfo?.Permission.includes("workorder:create") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                            <Copy className="h-5 w-5 inline-block mr-2" />Create Duplicate
                        </button>
                        :
                        <div className="flex items-center p-3">
                            <Spinner className="h-6 w-6 text-gray-400/50" />
                        </div>
                    }
                    {/* print Btn */}
                    <ReactToPrint
                        trigger={() => <button
                            className="flex items-center gap-2 w-full p-3 text-left mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer"
                            type="button"
                        >
                            <Printer className="h-5 w-5 inline-block mr-2" />Print
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
                            {workOrderData && Object.keys(workOrderData).length > 0 ? <PrintView view={true} workOrderData={workOrderData} ref={componentRef} appliedTaxes={appliedTaxes} /> : null}
                        </div>
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="w-64 bg-gradient-to-br from-gray-800 to-gray-700">
                        <SidebarContent />
                    </div>
                </div>

                {/* <div className="basis-[20%] h-full overflow-y-auto flex flex-col items-center gap-6 bg-gradient-to-br from-gray-800 to-gray-700">
                    <div className="text-center py-4">
                        <h2 className="text-lg font-normal text-gray-400">Total Amount</h2>
                        <h5 className="text-4xl text-white font-normal">${(workOrderData?.totalAmount).toFixed(2)}</h5>
                    </div>
                    <div className="flex flex-col items-center justify-start h-full w-full">
                        <div className="text-white w-full text-center font-medium">                            
                            <div onClick={() => workOrderData?.status === 'PENDING' && setWorkOrderFinished()} className={`w-full py-2 mx-auto ${workOrderData?.status === 'PENDING' ? "hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer" : "text-green-500 font-bold"}`}>{workOrderData?.status === 'PENDING' ? 'Finish' : 'Finished'}</div>
                            <div onClick={() => { dispatch({ type: 'SET_WORKORDER_VIEW', payload: false }); setEdit(true) }} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Edit</div>
                            <div onClick={() => setIsNotesFormOpen(true)} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Notes</div>
                            {!isLoading.delete ?
                                <div onClick={handleDel} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Delete</div>
                                :
                                <div className="flex items-center justify-center h-fit py-2.5">
                                    <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            }

                            {!isLoading.createInvoice ?
                                <div onClick={createInvoice} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">
                                    Create Invoice
                                </div>
                                :
                                <div className="flex items-center justify-center h-fit py-2.5">
                                    <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            }

                            {!isLoading.createCopy ?
                                <div onClick={createCopy} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">
                                    Create Duplicate
                                </div>
                                :
                                <div className="flex items-center justify-center h-fit py-2.5">
                                    <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            }
                            <ReactToPrint
                                trigger={() => <button
                                    className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer"
                                    type="button"
                                >
                                    Print
                                </button>}
                                content={() => componentRef.current}
                            />
                        </div>
                    </div>
                </div> */}

                {/* Mobile Layout */}
                <div className="lg:hidden h-full flex flex-col relative overflow-hidden">
                    {/* Mobile Header with Menu */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-800 to-gray-700">
                        <div className="text-white">
                            <h2 className="text-sm font-normal text-gray-400">Total Amount</h2>
                            <h5 className="text-xl text-white font-normal">
                                ${(workOrderData?.totalAmount).toFixed(2)}
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
                                {workOrderData && Object.keys(workOrderData).length > 0 ? (
                                    <PrintView view={true} workOrderData={workOrderData} ref={componentRef} appliedTaxes={appliedTaxes} />
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
            <NotesForm open={isNotesFormOpen} close={() => setIsNotesFormOpen(false)} workOrderId={workOrderData?.id} setWorkOrderData={setWorkOrderData} currentValue={workOrderData.notes} />
        </>
    );
}
export default ViewWorkOrder;