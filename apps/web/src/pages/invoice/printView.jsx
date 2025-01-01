import React, { useEffect, useState } from "react";
import { Typography } from "@material-tailwind/react";

const INVOICE_TABLE_HEAD = ["Customer", "Status", "Payment Method", "Total"];
const PRODUCT_TABLE_HEAD = ["Product", "Quantity", "Price", "Tax", "Amount"]

const printView = React.forwardRef(({printInvoice, appliedTaxes, totalAmountWithTax}, ref) => {
    
    const currentDate = new Date().toLocaleDateString();
    const [taxes, setTaxes] = useState([]);

    const formatCreatedAt = (createdAt) => {
        const date = new Date(createdAt);
        return date.toLocaleString();
    };

    const calculateAmount = (price, quantity) => {
        return price * quantity;
    };

    const calculateTotalAmount = (products) => {
        let total = 0;
        products.forEach((item) => {
            total += calculateAmount(item.price, item.invoice_product.quantity);
        });
        return total;
    };

    useEffect(() => {
        if (!printInvoice?.Product || !printInvoice?.Customer) return;
        const updatedTaxes = [];
        printInvoice.Product.forEach((prod) => {
            if (printInvoice.Customer.taxable) {
                prod.Tax?.forEach((productTax) => {
                    if (!updatedTaxes.some((tax) => tax.id === productTax.id)) {
                        updatedTaxes.push(productTax);
                    }
                });
            }
        });

        setTaxes(updatedTaxes);
    }, [])

    if (Object.keys(printInvoice).length > 0) {
        return (
            <div ref={ref} className="hidden print:block ">
                <div className="flex items-center justify-between p-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-bold">{printInvoice?.Business.name}</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-start justify-start">
                                <span className="text-sm font-normal text-black">{printInvoice?.Business.address}</span>
                                <span className="text-sm font-normal text-black">{printInvoice?.Business.city}, {printInvoice?.Business.state}, {printInvoice?.Business.zipcode}</span>
                                <span className="text-sm font-normal text-black">Phone: {printInvoice?.Business.tel}</span>
                                <span className="text-sm font-normal text-black">Fax: {printInvoice?.Business.fax}</span>
                                <span className="text-sm font-normal text-black">Email: {printInvoice?.Business.email}</span>
                            </div>
                            <img src={printInvoice?.Business.logo} className="rounded-xl h-[100px] w-[100px]" alt="Business logo" width={100} height={100} />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-semibold">Date: {currentDate}</span>
                        <span className="text-sm">Invoice No: #0000{printInvoice?.invoiceNumber}</span>
                        <span className="text-sm">License No: {printInvoice?.Business.licenseNumber}</span>
                        <span className="text-sm">Permit No: {printInvoice?.Business.permitNumber}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center p-4">
                    <div>
                        <table className="w-full min-w-max table-auto text-left">
                            <thead>
                                <tr>
                                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none opacity-70"
                                        >
                                            Bill To
                                        </Typography>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-2 border-b border-blue-gray-50 space-y-2">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {printInvoice.Customer.firstName} {printInvoice.Customer.lastName}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {printInvoice?.Customer.Address.street}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {printInvoice?.Customer.Address.city}, {printInvoice?.Customer.Address.state}, {printInvoice?.Customer.Address.zipcode}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            Phone: {printInvoice?.Customer.phone}
                                        </Typography>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex border border-black-2">
                        <div className="flex flex-col divide-y">
                            <span className="text-xs p-2">License No:</span>
                            <span className="text-xs p-2">Odometer</span>
                            <span className="text-xs p-2">Year</span>
                            <span className="text-xs p-2">Make</span>
                            <span className="text-xs p-2">Model</span>
                        </div>
                        <div className="flex flex-col divide-y">
                            <span className="text-xs p-2">{printInvoice?.CustomerVehicle.licenseNo}</span>
                            <span className="text-xs p-2">{printInvoice?.CustomerVehicle.odometer}</span>
                            <span className="text-xs p-2">{printInvoice?.CustomerVehicle.year}</span>
                            <span className="text-xs p-2">{printInvoice?.CustomerVehicle.make}</span>
                            <span className="text-xs p-2">{printInvoice?.CustomerVehicle.model}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full p-4">
                    <table className="w-full min-w-max table-auto text-left">
                        <thead>
                            <tr>
                                {PRODUCT_TABLE_HEAD.map((head) => (
                                    <th
                                        key={head}
                                        className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                                    >
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none opacity-70"
                                        >
                                            {head}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {printInvoice.Product.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {item.name}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {item.invoice_product.quantity}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {item.price}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={item.taxable}
                                            readOnly
                                        />
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {calculateAmount(item.price, item.invoice_product.quantity)}
                                        </Typography>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
                <div className="flex p-2">
                    <div className="basis-[50%] max-w-[50%] h-full p-4">
                        <div className="flex flex-col justify-end items-start h-full gap-6">
                            <div className="basis-[80%] flex flex-col">
                                <h1 className="font-semibold text-md">Terms & Conditions</h1>
                                <p className="text-xs border py-6 px-2 w-[80%]">you agree to the following terms and conditions. Our platform facilitates the purchase and sale
                                    of vehicle auto parts. All products are subject to availability and provided "as is." We are not responsible for any misuse or improper
                                    installation of parts. Returns and refunds are subject to our policies, which may change without notice. By continuing to use our services,
                                    you agree to comply with all applicable laws and regulations. For further inquiries, please contact our support team.</p>
                            </div>
                            <h2 className="basis-[20%] font-semibold text-lg italic">Thank You For Your Business!</h2>
                        </div>
                    </div>

                    <div className="basis-[50%] max-w-[50%]">
                        <div className="flex items-center justify-center border divide-x">
                            <h1 className="basis-[50%] max-w-[50%] text-1xl p-2">Subtotal</h1>
                            <h1 className="basis-[50%] max-w-[50%] text-1xl p-2">{calculateTotalAmount(printInvoice.Product)} $</h1>
                        </div>

                        <div className="flex flex-col">
                            {Object.keys(appliedTaxes).map((tax, ind) => (
                                <div key={ind} className="flex border divide-x">
                                    <span className="max-w-[50%] w-min p-2 whitespace-nowrap basis-[50%]" >{`${tax.split('_')[0]} (${tax.split('_')[1]}${tax.split('_')[2]})`}</span>
                                    <span className="max-w-[50%] text-1xl p-2 basis-[50%]">{tax.split('_')[2] === '%' ? appliedTaxes[tax].toFixed(2) : appliedTaxes[tax]} $</span>
                                </div>
                            ))}                            
                        </div>
                        <div className="flex items-center border divide-x">
                            <h1 className="basis-[50%] max-w-[50%] text-1xl p-2">Total</h1>
                            <h1 className="basis-[50%] max-w-[50%] text-1xl p-2">{totalAmountWithTax} $</h1>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

export default printView;