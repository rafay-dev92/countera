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

const ViewWorkOrder = ({ workOrderData, setWorkOrderData, componentRef, appliedTaxes, setEdit, close }) => {
    const confirm = useConfirm();
    const router = useNavigate();
    const { state, dispatch } = State();
    const [isLoading, setIsLoading] = React.useState({
        delete: false,
        createInvoice: false,
        createCopy: false,
        sendMail: false,        
    });
    const [isNotesFormOpen, setIsNotesFormOpen] = useState(false);
    
    // Delete Invoice
    const handleDel = async () => {
        const confirmed = await confirm();
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
        try {
            const res = await updateWorkOrder(workOrderData.id, { workOrderData: { status: 'Finished' }, products: [] }, state.userToken);
            const workorder = await res.json();
            if (res.status === 200) {
                setWorkOrderData(workorder.data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const createInvoice = async () => {
        const confirmed = await confirm("Are you sure you want to create an invoice for this work order?");
        if (!confirmed) return;
        setIsLoading({ ...isLoading, createInvoice: true });
        const selectedProductIds = workOrderData?.Product?.map((product) => `${product.id}:${product.workorder_product?.quantity}`);
        const data = {
            invoiceData: {
                totalAmount: workOrderData.totalAmount,
                paymentStatus: "Unpaid",
                CustomerId: workOrderData.CustomerId,
                CustomerVehicleId: workOrderData.CustomerVehicleId,
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
        const selectedProductIds = workOrderData?.Product?.map((product) => `${product.id}:${product.workorder_product?.quantity}`);

        const data = {
            workOrderData: {
                totalAmount: workOrderData.totalAmount,
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

    return (
        <>
            <div className="overflow-y-auto h-[80vh] overflow-x-hidden p-2">
                <div className="flex h-full">
                    <div className="basis-[80%]">
                        <div className="max-h-[75vh] overflow-y-auto">
                            {workOrderData && Object.keys(workOrderData).length > 0 ? <PrintView view={true} workOrderData={workOrderData} ref={componentRef} appliedTaxes={appliedTaxes} /> : null}
                        </div>
                    </div>
                    <div className="basis-[20%] h-full overflow-y-auto flex flex-col items-center gap-6 bg-gradient-to-br from-gray-800 to-gray-700">
                        <div className="text-center py-4">
                            <h2 className="text-lg font-normal text-gray-400">Total Amount</h2>
                            <h5 className="text-4xl text-white font-normal">${(workOrderData?.totalAmount).toFixed(2)}</h5>
                        </div>
                        <div className="flex flex-col items-center justify-start h-full w-full">
                            <div className="text-white w-full text-center font-medium">
                                {/* {!isLoading.sendMail ?
                                    <div onClick={sendMailToUser} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Send</div>
                                    :
                                    <div className="flex items-center justify-center h-fit py-2.5">
                                        <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                } */}
                                <div onClick={() => workOrderData?.status === 'Pending' && setWorkOrderFinished()} className={`w-full py-2 mx-auto ${workOrderData?.status === 'Pending' ? "hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer" : "text-green-500 font-bold"}`}>{workOrderData?.status === 'Pending' ? 'Finish' : 'Finished'}</div>
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
                                {/* print Btn */}
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
                    </div>
                </div>
            </div>
            <NotesForm open={isNotesFormOpen} close={() => setIsNotesFormOpen(false)} workOrderId={workOrderData?.id} setWorkOrderData={setWorkOrderData} currentValue={workOrderData.notes} />
        </>
    );
}
export default ViewWorkOrder;