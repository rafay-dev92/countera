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

const ViewInvoice = ({ printInvoice, setPrintInvoice, componentRef, appliedTaxes, setEdit, close }) => {
    const confirm = useConfirm();
    const { state, dispatch } = State();
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    const [isNotesFormOpen, setIsNotesFormOpen] = useState(false);
    const [totalAmountPaid, setTotalAmountPaid] = useState(0);
    const [isLoading, setIsLoading] = React.useState({
        delete: false,
        sendMail: false,
    });
    // const [openAccordian, setAccordianOpen] = useState(null);

    // const toggle = (index) => {
    //     setAccordianOpen(openAccordian === index ? null : index);
    // };

    // Delete Invoice
    const handleDel = async () => {
        const confirmed = await confirm();
        if (!confirmed) return;
        setIsLoading({ ...isLoading, delete: true });
        try {
            const res = await delInvoice(printInvoice.id, state.userToken);
            const invoice = await res.json();
            if (res.status === 200) {
                toast.success(invoice.message)
            }
            else if (res.status === 404) {
                toast.info(invoice.message)
            }
        } catch (error) {
            console.log(error)
            toast.error("Something went wrong");
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


    // send mail
    const sendMailToUser = async () => {
        setIsLoading({ ...isLoading, sendMail: true });
        try {
            const invoiceElement = componentRef.current;
            if (!invoiceElement) return;

            const canvas = await html2canvas(invoiceElement, {
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
            formData.append("pdf", pdfBlob, "invoice.pdf");
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

    useEffect(() => {
        if (Object.keys(printInvoice).length > 0 && printInvoice.Payments.length > 0) {
            const paidAmount = printInvoice.Payments.reduce((acc, payment) => acc + payment.paidAmount, 0);
            if (paidAmount !== totalAmountPaid) {
                setTotalAmountPaid(paidAmount);
                if (paidAmount === printInvoice.totalAmount && printInvoice.paymentStatus !== "Paid") {
                    setInvoiceStatus(printInvoice.id, "Paid");
                }
                else if (paidAmount > 0 && paidAmount < printInvoice.totalAmount) {
                    setInvoiceStatus(printInvoice.id, "Partially Paid");
                }
            }
        }
    }, [printInvoice])

    return (
        <>
            <div className="overflow-y-auto h-[80vh] overflow-x-hidden p-2">
                <div className="flex h-full">
                    <div className="basis-[80%]">
                        <div className="max-h-[75vh] overflow-y-auto">
                            {printInvoice && Object.keys(printInvoice).length > 0 ? <PrintView view={true} printInvoice={printInvoice} ref={componentRef} appliedTaxes={appliedTaxes} /> : null}
                        </div>
                    </div>
                    <div className="basis-[20%] h-full overflow-y-auto flex flex-col items-center gap-6 bg-gradient-to-br from-gray-800 to-gray-700">
                        <div className="text-center py-4">
                            <h2 className="text-lg font-normal text-gray-400">Balance Due</h2>
                            <h5 className="text-4xl text-white font-normal">${(printInvoice?.totalAmount - totalAmountPaid).toFixed(2)}</h5>
                        </div>
                        <div className="flex flex-col items-center justify-start h-full w-full">
                            <div className="text-white w-full text-center font-medium">
                                {!isLoading.sendMail ?
                                    <div onClick={sendMailToUser} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Send</div>
                                    :
                                    <div className="flex items-center justify-center h-fit py-2.5">
                                        <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                }
                                <div onClick={() => printInvoice?.paymentStatus !== 'Paid' && setIsPaymentFormOpen(true)} className={`w-full py-2 mx-auto ${printInvoice?.paymentStatus !== 'Paid' ? "hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer" : "text-green-500 font-bold"}`}>{printInvoice?.paymentStatus !== 'Paid' ? 'Pay' : 'Paid'}</div>
                                <div onClick={() => { dispatch({ type: 'SET_INVOICE_VIEW', payload: false });; setEdit(true) }} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Edit</div>
                                <div onClick={() => setIsNotesFormOpen(true)} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Notes</div>
                                {!isLoading.delete ?                                
                                    <div onClick={handleDel} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Delete</div>
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
            <NotesForm open={isNotesFormOpen} close={() => setIsNotesFormOpen(false)} invoiceId={printInvoice?.id} setPrintInvoice={setPrintInvoice} currentValue={printInvoice.notes} />
            <PaymentForm open={isPaymentFormOpen} close={() => setIsPaymentFormOpen(false)} totalAmount={printInvoice?.totalAmount} totalAmountPaid={totalAmountPaid} invoiceId={printInvoice?.id} setPrintInvoice={setPrintInvoice} />
        </>
    );
}
export default ViewInvoice;