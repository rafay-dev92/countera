import React, { useEffect, useState } from "react";
import { Typography } from "@material-tailwind/react";
import ApprovedImg from "@/assets/approved.png";

const PRODUCT_TABLE_HEAD = ["Product", "Quantity", "Price", "Tax", "Amount"]

const printView = React.forwardRef(({ view, workOrderData, appliedTaxes }, ref) => {
    const workOrderDate = new Date(workOrderData?.createdAt);
    const [taxes, setTaxes] = useState([]);

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
        products.forEach((item) => {
            total += parseFloat(calculateAmount(item.workorder_product.price, item.workorder_product.quantity));
        });
        return total.toFixed(2);
    };

    useEffect(() => {
        if (!workOrderData?.Product || !workOrderData?.Customer) return;
        const updatedTaxes = [];
        workOrderData.Product.forEach((prod) => {
            if (workOrderData.Customer.taxable) {
                prod.Tax?.forEach((productTax) => {
                    if (!updatedTaxes.some((tax) => tax.id === productTax.id)) {
                        updatedTaxes.push(productTax);
                    }
                });
            }
        });

        setTaxes(updatedTaxes);
    }, [])

    if (workOrderData && Object.keys(workOrderData).length > 0) {
        return (
            <div ref={ref} className={`print-page w-[794px] min-h-[1056px] bg-white mx-auto flex flex-col p-4 ${!view ? "hidden print:flex print-w-[794px]" : ""}`}>
                <div className="grid grid-cols-2 border-b">
                    <div className="col-span-1 h-full flex p-1">
                        <img src={workOrderData?.Business.logo} className="rounded-xl h-[100px]" alt="Business logo" height={100} />
                    </div>
                    <div className="col-span-1 flex flex-col items-end gap-1 p-2">
                        <span className="text-[12px] font-semibold">Date: {workOrderDate.toLocaleDateString("en-US")}</span>
                        <span className="text-[12px]">WorkOrder No: INV{`${workOrderData?.workOrderNumber}`.padStart(4, '0')}</span>
                        <span className="text-[12px]">License No: {workOrderData?.Business.licenseNumber ? workOrderData?.Business.licenseNumber : "N/A"}</span>
                        <span className="text-[12px]">Permit No: {workOrderData?.Business.permitNumber ? workOrderData?.Business.permitNumber : "N/A"}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 divide-x">
                    <div className="col-span-1 flex flex-col p-2">
                        <span className="text-[12px] font-normal ">{workOrderData?.Business.address}</span>
                        <span className="text-[12px] font-normal ">{workOrderData?.Business.city}, {workOrderData?.Business.state}, {workOrderData?.Business.zipcode}</span>
                        <span className="text-[12px] font-normal ">Phone: {workOrderData?.Business.tel}</span>
                        <span className="text-[12px] font-normal ">Fax: {workOrderData?.Business.fax}</span>
                        <span className="text-[12px] font-normal ">Email: {workOrderData?.Business.email}</span>
                    </div>

                    <div className="col-span-1 flex flex-col gap-1 p-2">
                        <h2 className="text-xs font-semibold underline">Bill To:</h2>
                        <div className="flex flex-col">
                            <span className="text-xs">{workOrderData?.Customer.firstName} {workOrderData?.Customer.lastName}</span>
                            {workOrderData?.Customer?.Address?.street && (
                                <span className="text-xs">{workOrderData.Customer.Address.street}</span>
                            )}
                            {(workOrderData?.Customer?.Address?.city || workOrderData?.Customer?.Address?.state || workOrderData?.Customer?.Address?.zipcode) && (
                                <span className="text-xs">
                                    {workOrderData?.Customer?.Address?.city ? workOrderData.Customer.Address.city : ''}
                                    {workOrderData?.Customer?.Address?.city && workOrderData?.Customer?.Address?.state ? ', ' : ''}
                                    {workOrderData?.Customer?.Address?.state ? workOrderData.Customer.Address.state : ''}
                                    {(workOrderData?.Customer?.Address?.city || workOrderData?.Customer?.Address?.state) && quotationData?.Customer?.Address?.zipcode ? ', ' : ''}
                                    {workOrderData?.Customer?.Address?.zipcode ? workOrderData.Customer.Address.zipcode : ''}
                                </span>
                            )}
                            {workOrderData?.Customer?.phone && (
                                <span className="text-xs">Phone: {workOrderData.Customer.phone}</span>
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
                                <span className="text-xs">{workOrderData?.CustomerVehicle.licenseNo ? workOrderData?.CustomerVehicle.licenseNo : 'N/A'}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Odometer:</span>
                                <span className="text-xs">{workOrderData?.CustomerVehicle.odometer}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Year:</span>
                                <span className="text-xs">{workOrderData?.CustomerVehicle.year}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Make:</span>
                                <span className="text-xs">{workOrderData?.CustomerVehicle.make}</span>
                            </div>
                            <div className="col-span-1 flex gap-1">
                                <span className="text-xs font-normal">Model:</span>
                                <span className="text-xs">{workOrderData?.CustomerVehicle.model}</span>
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {workOrderData.Product.map((item, index) => (
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
                                            <span className="text-gray-600 text-[10px]">{item?.workorder_product?.description}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[10%] text-center">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {item.workorder_product.quantity}
                                        </Typography>
                                    </td>
                                    <td className="p-2 border-b border-blue-gray-50 w-[15%] text-center">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {item.workorder_product.price}
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
                                    <td className="p-2 border-b border-blue-gray-50 w-[15%] text-center">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none text-xs"
                                        >
                                            {calculateAmount(item.workorder_product.price, item.workorder_product.quantity)}
                                        </Typography>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>

                <div className="border-y py-1 w-full flex items-center justify-center mt-auto">
                    <h4 className="text-xs font-normal italic">WorkOrder Summary</h4>
                </div>
                <div className="flex p-2 text-xs">
                    <div className="basis-[50%] max-w-[50%] h-full p-2">
                        Notes: {workOrderData.notes ? workOrderData.notes : 'N/A'}
                    </div>

                    <div className="basis-[50%] max-w-[50%]">
                        <div className="border-x border-t divide-y">
                            <div className="flex justify-between px-2 py-1">
                                <span>Subtotal</span>
                                <span>${calculateTotalAmount(workOrderData.Product)}</span>
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
                                <span className="">${parseFloat(workOrderData?.totalAmount.toFixed(2)) + parseFloat(workOrderData?.discount)}</span>
                            </div>
                        </div>

                        <div className="border-t border-x divide-y text-xs">
                            <div className="flex justify-between px-2 py-1">
                                <span className="">Discount</span>
                                <span className="">${workOrderData?.discount}</span>
                            </div>
                        </div>

                        <div className=" border divide-y text-xs">
                            <div className="flex justify-between px-2 py-1 font-medium">
                                <span className="">Grand Total</span>
                                <span className="">${workOrderData?.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

export default printView;