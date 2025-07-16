import React, { useEffect, useState } from "react";
import { Typography } from "@material-tailwind/react";
import PaidImg from "@/assets/paid.png";
import "react-quill/dist/quill.snow.css";


const printView = React.forwardRef(({ view, printInvoice, appliedTaxes }, ref) => {

    const invoiceDate = new Date(printInvoice?.createdAt);

    const calculateAmount = (price, quantity) => {
        const unitPrice = parseFloat(price) || 0;
        const qty = parseFloat(quantity) || 0;
        return (unitPrice * qty).toFixed(2);
    };

    const calculateTotalAmount = (products) => {
        let total = 0;
        products?.forEach((item) => {
            total += parseFloat(calculateAmount(item.invoice_product.price, item.invoice_product.quantity));
        });
        return total.toFixed(2);
    };

    if (Object.keys(printInvoice).length > 0) {
        return (
            <div ref={ref} className={`print-page w-[794px] min-h-[1123px] bg-white mx-auto flex flex-col p-4 ${!view ? "hidden print:flex" : ""}`}>
                <div className="grid grid-cols-2 border-b">
                    <div className="col-span-1 h-full flex p-1">
                        <img src={printInvoice?.Business.logo} className="rounded-xl h-[100px]" alt="Business logo" height={100} />
                    </div>
                    <div className="col-span-1 flex flex-col items-end gap-1 p-2">
                        <span className="text-[12px] font-semibold">Date: {invoiceDate.toLocaleDateString("en-US")}</span>
                        <span className="text-[12px]">Invoice No: INV{`${printInvoice?.invoiceNumber}`.padStart(4, '0')}</span>
                        <span className="text-[12px]">License No: {printInvoice?.Business.licenseNumber ? printInvoice?.Business.licenseNumber : "N/A"}</span>
                        <span className="text-[12px]">Permit No: {printInvoice?.Business.permitNumber ? printInvoice?.Business.permitNumber : "N/A"}</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 divide-x">
                    <div className="col-span-1 flex flex-col p-2">
                        <span className="text-[12px] font-normal ">{printInvoice?.Business.address}</span>
                        <span className="text-[12px] font-normal ">{printInvoice?.Business.city}, {printInvoice?.Business.state}, {printInvoice?.Business.zipcode}</span>
                        <span className="text-[12px] font-normal ">Phone: {printInvoice?.Business.tel}</span>
                        <span className="text-[12px] font-normal ">Fax: {printInvoice?.Business.fax}</span>
                        <span className="text-[12px] font-normal ">Email: {printInvoice?.Business.email}</span>
                    </div>

                    <div className="col-span-1 flex flex-col gap-1 p-2">
                        <h2 className="text-xs font-semibold underline">Bill To:</h2>
                        <div className="flex flex-col">
                            <span className="text-xs">{printInvoice?.Customer.firstName} {printInvoice?.Customer.lastName}</span>
                            {printInvoice?.Customer?.Address?.street && (
                                <span className="text-xs">{printInvoice.Customer.Address.street}</span>
                            )}
                            {(printInvoice?.Customer?.Address?.city || printInvoice?.Customer?.Address?.state || printInvoice?.Customer?.Address?.zipcode) && (
                                <span className="text-xs">
                                    {printInvoice?.Customer?.Address?.city ? printInvoice.Customer.Address.city : ''}
                                    {printInvoice?.Customer?.Address?.city && printInvoice?.Customer?.Address?.state ? ', ' : ''}
                                    {printInvoice?.Customer?.Address?.state ? printInvoice.Customer.Address.state : ''}
                                    {(printInvoice?.Customer?.Address?.city || printInvoice?.Customer?.Address?.state) && printInvoice?.Customer?.Address?.zipcode ? ', ' : ''}
                                    {printInvoice?.Customer?.Address?.zipcode ? printInvoice.Customer.Address.zipcode : ''}
                                </span>
                            )}
                            {printInvoice?.Customer?.phone && (
                                <span className="text-xs">Phone: {printInvoice.Customer.phone}</span>
                            )}
                        </div>
                    </div>

                    <div className="col-span-1 flex flex-col gap-1 p-2">
                        <h2 className="text-xs font-semibold underline">Vehicle Info:</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">License No:</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs">{printInvoice?.CustomerVehicle.licenseNo ? printInvoice?.CustomerVehicle.licenseNo : 'N/A'}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Odometer:</span>
                                <span className="text-xs">{printInvoice?.CustomerVehicle.odometer}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Year:</span>
                                <span className="text-xs">{printInvoice?.CustomerVehicle.year}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Make:</span>
                                <span className="text-xs">{printInvoice?.CustomerVehicle.make}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Model:</span>
                                <span className="text-xs">{printInvoice?.CustomerVehicle.model}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full text-sm">
                    <table className="w-full min-w-max table-auto text-left">
                        <thead>
                            <tr>
                                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 w-[5%] text-center font-normal leading-none text-[13px]">#</th>
                                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 w-[35%] font-normal leading-none text-[13px]">Product</th>
                                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 w-[10%] text-center font-normal leading-none text-[13px]">Quantity</th>
                                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 w-[15%] text-center font-normal leading-none text-[13px]">Unit Price</th>
                                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 w-[10%] text-center font-normal leading-none text-[13px]">Tax</th>
                                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 w-[15%] text-center font-normal leading-none text-[13px]">Total Price</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-xs">
                            {printInvoice?.Product?.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-2 border-b border-blue-gray-50 w-[5%] text-center">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {index + 1}
                                        </Typography>
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[35%]">
                                        <div className="flex flex-col">
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal leading-none text-xs"
                                            >
                                                {item.name}
                                            </Typography>
                                            <span className="text-gray-600 text-[10px]">{item?.invoice_product?.description}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[10%] text-center">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {item.invoice_product.quantity}
                                        </Typography>
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[15%] text-center">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {item.invoice_product.price}
                                        </Typography>
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[10%] text-center">
                                        <input
                                            type="checkbox"
                                            checked={item.taxable || false}
                                            readOnly
                                            className="w-3 h-3"
                                        />
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[15%] text-center">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {calculateAmount(item.invoice_product.price, item.invoice_product.quantity)}
                                        </Typography>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>

                <div className="border-y py-1 w-full flex items-center justify-center mt-auto">
                    <h4 className="text-xs font-normal italic">Invoice Summary</h4>
                </div>
                <div className="flex p-2 text-xs">
                    <div className="basis-[50%] max-w-[50%] h-full p-2">
                        Notes: {printInvoice.notes ? printInvoice.notes : 'N/A'}
                    </div>

                    {/* Financial Summary */}
                    <div className="basis-[50%] max-w-[50%]">
                        <div className="border-x border-t divide-y">
                            <div className="flex justify-between px-2 py-1">
                                <span>Subtotal</span>
                                <span>${calculateTotalAmount(printInvoice.Product)}</span>
                            </div>

                        </div>

                        <div className="flex flex-col text-xs">
                            {Object.keys(appliedTaxes).map((tax, ind) => (
                                <div key={ind} className="border-t border-x divide-y">
                                    <div className="flex justify-between px-2 py-1">
                                        <span className="">
                                            {`${tax.split('_')[0]} (${tax.split('_')[1]}${tax.split('_')[2]})`}
                                        </span>
                                        <span className="">
                                            ${tax.split('_')[2] === '%' ? appliedTaxes[tax].toFixed(2) : appliedTaxes[tax]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-x divide-y text-xs">
                            <div className="flex justify-between px-2 py-1">
                                <span className="">Total</span>
                                <span className="">${parseFloat(printInvoice?.totalAmount.toFixed(2)) + parseFloat(printInvoice?.discount)}</span>
                            </div>
                        </div>

                        <div className="border-t border-x divide-y text-xs">
                            <div className="flex justify-between px-2 py-1">
                                <span className="">Discount</span>
                                <span className="">${printInvoice?.discount}</span>
                            </div>
                        </div>

                        <div className=" border divide-y text-xs">
                            <div className="flex justify-between px-2 py-1 font-medium">
                                <span className="">Grand Total</span>
                                <span className="">${printInvoice?.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="p-1 border mt-2 text-center font-medium text-xs">
                            Payments
                        </div>

                        {printInvoice?.Payments.length > 0 ? (
                            printInvoice.Payments.map((payment, index) => {
                                const date = new Date(payment.createdAt);
                                return (
                                    <div key={index} className="border-b border-x divide-x text-xs">
                                        <div className="flex justify-between px-2 py-1">
                                            <span className="">
                                                {payment.paymentMethod} on {date.toLocaleDateString("en-US")}
                                            </span>
                                            <span className="">
                                                ${payment.paidAmount}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="border-b border-x divide-x text-xs">
                                <div className="flex justify-between px-2 py-1">
                                    <span className="">N/A</span>
                                    <span className="">$0.00</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col justify-center border-t border-gray-300 p-2 gap-8">
                    <div className="flex flex-col justify-end items-start h-full w-full gap-2 mt-6">
                        <div className="flex flex-col">

                            <div className="text-xs flex w-full mb-2">
                                <span className="whitespace-nowrap">SignX</span>
                                <div className=" border-t border-gray-500 mt-3 ms-2 w-48 mr-2">
                                    {/* <p className="text-xs text-black text-center mt-1">(Customer Signature)</p> */}
                                </div>
                                <span>Date</span>
                                <div className=" border-t border-gray-500 mt-3 ms-2 w-48">
                                </div>
                            </div>
                            <h2 className="font-medium text-xs italic">Thanks For Your Business!</h2>
                            <p className="text-[9px] py-1 leading-relaxed">
                                <span className="block">## Tire Warranty Options</span>
                                <div className="flex flex-wrap gap-3 text-[9px]">
                                    {[
                                        { key: "manufactureWarranty", label: "Manufacturer Warranty" },
                                        { key: "roadHazardWarranty", label: "Road Hazard" },
                                        { key: "noWarranty", label: "No Warranty" },
                                        { key: "flatRepairWarranty", label: "Flat Repair" },
                                        { key: "rotationWarranty", label: "Rotation" },
                                        { key: "balance", label: "Balance" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={!!printInvoice?.[key] || false}
                                                readOnly
                                                className="w-3 h-3"
                                            />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </p>
                            <div className="quill-content"
                                dangerouslySetInnerHTML={{
                                    __html: printInvoice?.Business.termsAndConditions || "",
                                }}
                            >
                            </div>


                            {/* <p className="text-[9px] py-1 leading-relaxed">
                                <span className="block">## Terms & Conditions  </span>
                                <div className="text-[9px] py-1 leading-tight">
                                    No verbal agreement by any salesperson is binding on the company. You are authorized to deliver and/or install
                                    the listed products under the terms of this order. Any operation of the vehicle for testing, inspection, or delivery
                                    is at my risk. A mechanic's lien is placed on the vehicle to secure payment for installed products. The company is
                                    not responsible for damage or loss of items in the vehicle due to fire, theft, accident, or other uncontrollable events.
                                    If legal action is taken to collect payment, the purchaser will cover attorney fees, court costs, and collection expenses.
                                    The dealership is not liable for wheel damage. I acknowledge receipt and approval of this order and its terms.
                                </div>
                            </p>
                            <p className="text-[9px] py-1 leading-relaxed">
                                <span className="block">## All Sales Are Final</span>
                                <span className="block"><b>NOTICE:</b> We are not responsible for any goods left over 3 days from above date.</span>
                                <span className="block"><b>Return/Exchange:</b> All returns or cancellations subject to freight and hauling charges and a 25% restocking fee.</span>
                                <span className="block"><b>NOTICE:</b> Customer is responsible for maintaining:</span>
                                <span className="block">a) tire air pressure per manufacturer specifications</span>
                                <span className="block">b) wire wheels per manufacturer specifications .The dealership is not liable for issues with lugs, nuts, or studs.</span>
                            </p>
                            <p className="text-[9px] py-1 leading-relaxed">
                                <span className="block"> ## Warranty Disclaimer</span>
                                <div className="text-[9px] py-1 leading-tight">
                                    All product warranties are provided solely by the manufacturer. The seller expressly disclaims all express or implied warranties,
                                    including merchantability or fitness for a particular purpose, and does not authorize any other party to assume liability on its behalf.
                                    The buyer may not claim consequential, incidental, or indirect damages, including property damage, lost time, or lost income.
                                </div>
                            </p> */}
                        </div>
                    </div>
                </div>

            </div>
        );
    }
});

export default printView;