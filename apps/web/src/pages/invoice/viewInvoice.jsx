import React, { useEffect, useState } from "react";
import PrintView from "./printView";
import { delInvoice } from "@/services/delInvoice";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import PaymentForm from "./paymentForm";
import { updateInvoice } from "@/services/updateInvoice";
import ReactToPrint from "react-to-print";


const ViewInvoice = ({ printInvoice, setPrintInvoice, componentRef, appliedTaxes, setEdit, close }) => {
    const { state, dispatch } = State();
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    const [totalAmountPaid, setTotalAmountPaid] = useState(0);
    // const [openAccordian, setAccordianOpen] = useState(null);

    // const toggle = (index) => {
    //     setAccordianOpen(openAccordian === index ? null : index);
    // };

    // Delete Invoice
    const handleDel = async () => {
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
                            <h5 className="text-4xl text-white font-normal">{(printInvoice?.totalAmount - totalAmountPaid).toFixed(2)} $</h5>
                        </div>
                        <div className="flex flex-col items-center justify-start h-full w-full">
                            <div className="text-white w-full text-center font-medium">
                                <div className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Send</div>
                                <div onClick={() => printInvoice?.paymentStatus !== 'Paid' && setIsPaymentFormOpen(true)} className={`w-full py-2 mx-auto ${printInvoice?.paymentStatus !== 'Paid' ? "hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer" : "text-green-500 font-bold"}`}>{printInvoice?.paymentStatus !== 'Paid' ? 'Pay' : 'Paid'}</div>
                                {/* {['Copy'].map((item, index) => (
                                <div key={index}>
                                    <div
                                        className={`px-4 py-2 hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer`}
                                        onClick={() => toggle(index)}
                                    >
                                        {item}
                                    </div>
                                    {openAccordian === index && (
                                        <div className="px-4 py-2 text-sm text-gray-300 bg-gradient-to-br from-gray-800 to-gray-700">
                                            {item} details...
                                        </div>
                                    )}
                                </div>
                                ))} */}
                                <div onClick={() => { dispatch({ type: 'SET_INVOICE_VIEW', payload: false }); ; setEdit(true) }} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Edit</div>
                                <div onClick={handleDel} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Delete</div>
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
            <PaymentForm open={isPaymentFormOpen} close={() => setIsPaymentFormOpen(false)} totalAmount={printInvoice?.totalAmount} totalAmountPaid={totalAmountPaid} invoiceId={printInvoice?.id} setPrintInvoice={setPrintInvoice} />
        </>
    );
}
export default ViewInvoice;