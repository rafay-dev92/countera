import React, { useEffect, useState } from "react";
import PrintView from "./printView";
import { delInvoice } from "@/services/delInvoice";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import ReactToPrint from "react-to-print";
import { updateQuotation } from "@/services/updateQuotation";
import { delQuotation } from "@/services/delQuotaion";


const ViewQuotation = ({ quotationData, setQuotationData, componentRef, appliedTaxes, setIsViewOpen, setEdit, close }) => {
    const { state } = State();

    // const [openAccordian, setAccordianOpen] = useState(null);

    // const toggle = (index) => {
    //     setAccordianOpen(openAccordian === index ? null : index);
    // };

    // Delete Invoice
    const handleDel = async () => {
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
        close();
    }

    const setQuotationApproved = async () => {
        try {
            const res = await updateQuotation(quotationData.id, { quotationData: { approved: true }, products: [] }, state.userToken);
            const quotation = await res.json();
            if (res.status === 200) {
                setQuotationData(quotation.data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <div className="overflow-y-auto h-[80vh] overflow-x-hidden p-2">
                <div className="flex h-full">
                    <div className="basis-[80%]">
                        <div className="max-h-[75vh] overflow-y-auto">
                            {quotationData && Object.keys(quotationData).length > 0 ? <PrintView view={true} quotationData={quotationData} ref={componentRef} appliedTaxes={appliedTaxes} /> : null}
                        </div>
                    </div>
                    <div className="basis-[20%] h-full overflow-y-auto flex flex-col items-center gap-6 bg-gradient-to-br from-gray-800 to-gray-700">                        
                    <div className="text-center py-4">
                            <h2 className="text-lg font-normal text-gray-400">Total Amount</h2>
                            <h5 className="text-4xl text-white font-normal">{(quotationData?.totalAmount).toFixed(2)} $</h5>
                        </div>
                        <div className="flex flex-col items-center justify-start h-full w-full">
                            <div className="text-white w-full text-center font-medium">
                                <div className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Send</div>
                                <div onClick={() => !quotationData?.approved && setQuotationApproved()} className={`w-full py-2 mx-auto ${!quotationData?.approved ? "hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer" : "text-green-500 font-bold"}`}>{!quotationData?.approved ? 'Approve' : 'Approved'}</div>
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
                                <div onClick={() => { setIsViewOpen(false); setEdit(true) }} className="w-full py-2 mx-auto hover:bg-gradient-to-br from-gray-700 to-gray-600 cursor-pointer">Edit</div>
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
        </>
    );
}
export default ViewQuotation;