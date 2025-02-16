import React, { useEffect, useState } from "react";
import { Typography } from "@material-tailwind/react";
import ApprovedImg from "@/assets/approved.png";

const INVOICE_TABLE_HEAD = ["Customer", "Status", "Payment Method", "Total"];
const PRODUCT_TABLE_HEAD = ["Product", "Quantity", "Price", "Tax", "Amount"]

const printView = React.forwardRef(({view, quotationData, appliedTaxes}, ref) =>  {
    const quotationDate = new Date(quotationData?.createdAt);
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
            total += calculateAmount(item.price, item.quotation_product.quantity);
        });
        return total;
    };

    useEffect(() => {
        if (!quotationData?.Product || !quotationData?.Customer) return;
        const updatedTaxes = [];
        quotationData.Product.forEach((prod) => {
            if (quotationData.Customer.taxable) {
                prod.Tax?.forEach((productTax) => {
                    if (!updatedTaxes.some((tax) => tax.id === productTax.id)) {
                        updatedTaxes.push(productTax);
                    }
                });
            }
        });

        setTaxes(updatedTaxes);
    }, [])

    if (quotationData && Object.keys(quotationData).length > 0) {
        return (
            <div ref={ref} className={`${!view ? "hidden print:block" : ""}`}>
                <div className="flex items-center justify-between p-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-bold mb-3">{quotationData?.Business.name}</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-start justify-start">
                                <span className="text-sm font-normal text-black">{quotationData?.Business.address}</span>
                                <span className="text-sm font-normal text-black">{quotationData?.Business.city}, {quotationData?.Business.state}, {quotationData?.Business.zipcode}</span>
                                <span className="text-sm font-normal text-black">Phone: {quotationData?.Business.tel}</span>
                                <span className="text-sm font-normal text-black">Fax: {quotationData?.Business.fax}</span>
                                <span className="text-sm font-normal text-black">Email: {quotationData?.Business.email}</span>
                            </div>
                            <img src={quotationData?.Business.logo} className="rounded-xl h-[100px] w-[100px]" alt="Business logo" width={100} height={100} />
                        </div>
                    </div>
                    {quotationData?.approved && (
                        <div className="">
                            <img src={ApprovedImg} alt="approved" width={170} height={170} />
                        </div>
                    )}
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-semibold">Date: {quotationDate.toLocaleDateString("en-US")}</span>
                        <span className="text-sm">Quotation No: #{`${quotationData?.quotationNumber}`.padStart(5, '0')}</span>
                        <span className="text-sm">License No: {quotationData?.Business.licenseNumber}</span>
                        <span className="text-sm">Permit No: {quotationData?.Business.permitNumber}</span>
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
                                            {quotationData.Customer.firstName} {quotationData.Customer.lastName}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {quotationData?.Customer.Address.street}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {quotationData?.Customer.Address.city}, {quotationData?.Customer.Address.state}, {quotationData?.Customer.Address.zipcode}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            Phone: {quotationData?.Customer.phone}
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
                            <span className="text-xs p-2">{quotationData?.CustomerVehicle.licenseNo}</span>
                            <span className="text-xs p-2">{quotationData?.CustomerVehicle.odometer}</span>
                            <span className="text-xs p-2">{quotationData?.CustomerVehicle.year}</span>
                            <span className="text-xs p-2">{quotationData?.CustomerVehicle.make}</span>
                            <span className="text-xs p-2">{quotationData?.CustomerVehicle.model}</span>
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
                            {quotationData.Product.map((item, index) => (
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
                                            {item.quotation_product.quantity}
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
                                            {calculateAmount(item.price, item.quotation_product.quantity)}
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
                                <h1 className="font-semibold text-md mb-2">Terms & Conditions</h1>
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
                            <h1 className="basis-[50%] max-w-[50%] text-1xl p-2">{calculateTotalAmount(quotationData.Product)} $</h1>
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
                            <h1 className="basis-[50%] max-w-[50%] text-1xl p-2">{quotationData?.totalAmount} $</h1>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

export default printView;