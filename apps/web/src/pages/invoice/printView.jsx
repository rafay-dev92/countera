import React, { useEffect, useState } from "react";
import { Typography } from "@material-tailwind/react";
import PaidImg from "@/assets/paid.png";

const INVOICE_TABLE_HEAD = ["Customer", "Status", "Payment Method", "Total"];
const PRODUCT_TABLE_HEAD = ["Product", "Quantity", "Price", "Tax", "Amount"]

const printView = React.forwardRef(({ view, printInvoice, appliedTaxes }, ref) => {

    const invoiceDate = new Date(printInvoice?.createdAt);

    const formatCreatedAt = (createdAt) => {
        const date = new Date(createdAt);
        return date.toLocaleString();
    };

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
            <div ref={ref} className={`min-h-screen flex flex-col ${!view ? "hidden print:flex print:min-h-screen" : ""}`}>
                <div className="grid grid-cols-3 border divide-x">
                    <div className="col-span-1 flex flex-col p-2">
                        <span className="text-[12px] font-normal ">{printInvoice?.Business.address}</span>
                        <span className="text-[12px] font-normal ">{printInvoice?.Business.city}, {printInvoice?.Business.state}, {printInvoice?.Business.zipcode}</span>
                        <span className="text-[12px] font-normal ">Phone: {printInvoice?.Business.tel}</span>
                        <span className="text-[12px] font-normal ">Fax: {printInvoice?.Business.fax}</span>
                        <span className="text-[12px] font-normal ">Email: {printInvoice?.Business.email}</span>
                    </div>
                    <div className="col-span-1 h-full flex">
                        <img src={printInvoice?.Business.logo} className="rounded-xl h-[100px] w-[100px] m-auto" alt="Business logo" width={100} height={100} />
                    </div>
                    <div className="col-span-1 flex flex-col items-end gap-1 p-2">
                        <span className="text-[12px] font-semibold">Date: {invoiceDate.toLocaleDateString("en-US")}</span>
                        <span className="text-[12px]">Invoice No: INV{`${printInvoice?.invoiceNumber}`.padStart(4, '0')}</span>
                        <span className="text-[12px]">License No: {printInvoice?.Business.licenseNumber}</span>
                        <span className="text-[12px]">Permit No: {printInvoice?.Business.permitNumber}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 border divide-x">
                    <div className="col-span-1 flex flex-col gap-1 p-2">
                        <h2 className="text-xs font-semibold underline">Vehicle Info:</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-1 flex gap-1">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-normal">License No:</span>
                                    <span className="text-xs font-normal">Odometer:</span>
                                    <span className="text-xs font-normal">Year:</span>
                                    <span className="text-xs font-normal">Make:</span>
                                    {/* <span className="text-xs">Model</span> */}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs">{printInvoice?.CustomerVehicle.licenseNo ? printInvoice?.CustomerVehicle.licenseNo : 'N/A'}</span>
                                    <span className="text-xs">{printInvoice?.CustomerVehicle.odometer}</span>
                                    <span className="text-xs">{printInvoice?.CustomerVehicle.year}</span>
                                    <span className="text-xs">{printInvoice?.CustomerVehicle.make}</span>
                                    {/* <span className="text-xs">{printInvoice?.CustomerVehicle.model}</span> */}
                                </div>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-normal">Model:</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs">{printInvoice?.CustomerVehicle.model}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-1 flex flex-col gap-1 p-2">
                        <h2 className="text-xs font-semibold underline">Bill To:</h2>
                        <div className="flex flex-col">
                            <span className="text-xs">{printInvoice?.Customer.firstName} {printInvoice?.Customer.lastName}</span>
                            <span className="text-xs">{printInvoice?.Customer.Address.street}</span>
                            <span className="text-xs">{printInvoice?.Customer.Address.city}, {printInvoice?.Customer.Address.state}, {printInvoice?.Customer.Address.zipcode}</span>
                            <span className="text-xs">Phone: {printInvoice?.Customer.phone}</span>
                        </div>

                    </div>
                </div>

                <div className="w-full p-2 text-sm">
                    <table className="w-full min-w-max table-auto text-left">
                        <thead>
                            <tr>
                                {PRODUCT_TABLE_HEAD.map((head, i) => (
                                    <th
                                        key={head}
                                        className={`border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 ${i === 0 ? 'w-[60%]' : 'w-[10%] text-center'
                                            }`}
                                    >
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none opacity-70 text-xs"
                                        >
                                            {head}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-xs">
                            {printInvoice?.Product?.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-2 border-b border-blue-gray-50 w-[60%]">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {item.name}
                                        </Typography>
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
                                    <td className="p-2 border-b border-blue-gray-50 w-[10%] text-center">
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
                                            checked={item.taxable}
                                            readOnly
                                            className="w-3 h-3"
                                        />
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[10%] text-center">
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

                <div className="flex p-2 text-xs mt-auto">
                    {/* Terms and Conditions */}
                    <div className="basis-[50%] max-w-[50%] h-full p-2">
                        <div className="flex flex-col justify-end items-start h-full gap-2">
                            <div className="basis-[80%] flex flex-col">
                                <h1 className="font-medium text-sm mb-1">Terms & Conditions</h1>
                                <p className="text-xs border py-3 px-2 w-[90%] leading-relaxed">
                                    you agree to the following terms and conditions. Our platform facilitates the purchase and sale
                                    of vehicle auto parts. All products are subject to availability and provided "as is." We are not
                                    responsible for any misuse or improper installation of parts. Returns and refunds are subject to
                                    our policies, which may change without notice. By continuing to use our services, you agree to
                                    comply with all applicable laws and regulations. For further inquiries, please contact our
                                    support team.
                                </p>
                            </div>
                            <h2 className="basis-[20%] font-semibold text-sm italic">Thank You For Your Business!</h2>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="basis-[50%] max-w-[50%]">
                        <div className="flex items-center justify-center border divide-x text-xs">
                            <h1 className="basis-[50%] max-w-[50%] p-1">Subtotal</h1>
                            <h1 className="basis-[50%] max-w-[50%] p-1">${calculateTotalAmount(printInvoice.Product)}</h1>
                        </div>

                        <div className="flex flex-col text-xs">
                            {Object.keys(appliedTaxes).map((tax, ind) => (
                                <div key={ind} className="flex border divide-x">
                                    <span className="max-w-[50%] w-min p-1 whitespace-nowrap basis-[50%]">
                                        {`${tax.split('_')[0]} (${tax.split('_')[1]}${tax.split('_')[2]})`}
                                    </span>
                                    <span className="max-w-[50%] p-1 basis-[50%]">
                                        ${tax.split('_')[2] === '%' ? appliedTaxes[tax].toFixed(2) : appliedTaxes[tax]}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center border divide-x text-xs">
                            <h1 className="basis-[50%] max-w-[50%] p-1">Discount</h1>
                            <h1 className="basis-[50%] max-w-[50%] p-1">${printInvoice?.discount}</h1>
                        </div>

                        <div className="flex items-center border divide-x text-xs">
                            <h1 className="basis-[50%] max-w-[50%] p-1 font-semibold">Total</h1>
                            <h1 className="basis-[50%] max-w-[50%] p-1 font-semibold">${printInvoice?.totalAmount.toFixed(2)}</h1>
                        </div>

                        <div className="p-1 border mt-2 text-center font-medium text-xs">
                            Payments
                        </div>

                        {printInvoice?.Payments.length > 0 ? (
                            printInvoice.Payments.map((payment, index) => {
                                const date = new Date(payment.createdAt);
                                return (
                                    <div key={index} className="flex items-center border divide-x text-xs">
                                        <h1 className="basis-[50%] max-w-[50%] p-1">
                                            {payment.paymentMethod} on {date.toLocaleDateString("en-US")}
                                        </h1>
                                        <h1 className="basis-[50%] max-w-[50%] p-1">
                                            ${payment.paidAmount}
                                        </h1>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center border divide-x text-xs">
                                <h1 className="basis-[50%] max-w-[50%] p-1">N/A</h1>
                                <h1 className="basis-[50%] max-w-[50%] p-1">$0.00</h1>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
});

export default printView;