import React, { useEffect, useState } from 'react';
import { Typography } from "@material-tailwind/react";
import { State } from '@/state/Context';
import { CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid';

const CustomerReportPreview = React.forwardRef(({ invoices, productsCategories, taxes }, ref) => {
    const INVOICE_TABLE_HEAD = ["Customer", "Invoice Number", "Invoice Date", "Subtotal", "Tax Total", "Total", "Balance", "Paid"];
    const { state } = State();
    const calculateTaxes = (products, customerType) => {
        if (customerType === 'business') return {};
        const productTaxes = {};

        products?.forEach((product) => {
            product.Tax?.forEach((productTax) => {
                const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

                if (!productTaxes[key]) {
                    productTaxes[key] = 0;
                }

                if (productTax.type === "%") {
                    productTaxes[key] += product.invoice_product.price * product.invoice_product.quantity * (productTax.rate / 100);
                } else {
                    productTaxes[key] += product.invoice_product.quantity * productTax.rate;
                }
            });
        });
        return productTaxes;
    };

    const taxTotals = taxes.map(tax => {
        const value = invoices.reduce((sum, invoice) => {
            const productTaxes = calculateTaxes(invoice.Products, invoice.Customer?.customerType);
            const matchingKey = Object.keys(productTaxes)?.find(key => key.split('_')[0] === tax);
            const taxValue = matchingKey ? (productTaxes[matchingKey]) : 0;
            return sum + taxValue;
        }, 0);
        return value;
    });

    const totalInvoiceTaxAmount = (invoice) => {
        const productTaxes = calculateTaxes(invoice.Products, invoice.Customer?.customerType);
        const taxValue = Object.values(productTaxes).reduce((sum, tax) => sum + tax, 0);
        return taxValue;
    }

    const taxablePartsTotal = invoices.reduce((sum, invoice) => {
        const isCustomerTaxExempt = invoice.Customer?.customerType === 'business';
        if (isCustomerTaxExempt) return sum;
        const matchedProducts = invoice.Products?.filter(p => p.taxable) || [];
        matchedProducts.forEach(matchedProduct => {
            const quantity = matchedProduct?.invoice_product?.quantity || 0;
            const price = matchedProduct?.price || 0;
            sum += price * quantity;
        });
        return sum;
    }, 0);

    const nonTaxableWholeSaleTotal = invoices.reduce((sum, invoice) => {
        const isCustomerTaxExempt = invoice.Customer?.customerType === 'business';
        if (!isCustomerTaxExempt) return sum;
        const matchedProducts = invoice.Products?.filter(p => p.taxable) || [];
        matchedProducts.forEach(matchedProduct => {
            const quantity = matchedProduct?.invoice_product?.quantity || 0;
            const price = matchedProduct?.price || 0;
            sum += price * quantity;
        });
        return sum;
    }, 0);

    const nonTaxableLabourTotal = invoices.reduce((sum, invoice) => {
        const matchedProducts = invoice.Products?.filter(p => !p.taxable);
        matchedProducts.forEach(matchedProduct => {
            const quantity = matchedProduct?.invoice_product?.quantity || 0;
            const price = matchedProduct?.price || 0;
            sum += price * quantity;
        });
        return sum;
    }, 0);

    return (
        <div ref={ref} className="text-black bg-white border-2 mt-4 print:mt-0 print:border-0 print:p-0">
            <div className='p-4'>
                <div className="flex gap-1">
                    <div className="flex flex-col w-full">
                        <h3 className="text-2xl font-bold mb-3">{state.business.name}</h3>
                        <div className="flex flex-col items-start justify-start">
                            <span className="text-sm font-normal text-black">{state.business.address}</span>
                            <span className="text-sm font-normal text-black">{state.business.city}, {state.business.state}, {state.business.zipcode}</span>
                            <span className="text-sm font-normal text-black">Phone: {state.business.tel}</span>
                            <span className="text-sm font-normal text-black">Fax: {state.business.fax}</span>
                            <span className="text-sm font-normal text-black">Email: {state.business.email}</span>
                        </div>
                    </div>
                    <img src={state.business.logo} className="rounded-xl h-[100px] w-[100px]" alt="Business logo" width={100} height={100} />
                </div>
            </div>
            <div className='w-full p-2'>
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {INVOICE_TABLE_HEAD.map((head) => (
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
                        {invoices?.map((item, index) => {
                            const productTaxes = calculateTaxes(item.Product, item.Customer?.customerType);
                            const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                                timeZone: state.business.timezone ? state.business.timezone : '',
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                            });
                            return (
                                <tr key={index}>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {item.Customer?.customerType === 'business' ? <StarIcon className='w-3.5 h-3.5 mb-1 text-blue-600 inline' /> : null} {item.Customer?.firstName} {item.Customer?.lastName}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            INV{String(item.invoiceNumber).padStart(4, '0')}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {formattedDate}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {(item.totalAmount - totalInvoiceTaxAmount(item)).toFixed(2)}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {/* {(taxTotals.reduce((sum, tax) => sum + tax, 0)).toFixed(2)} */}
                                            {totalInvoiceTaxAmount(item).toFixed(2)}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {item.totalAmount}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none "
                                        >
                                            {item.totalAmount - item.Payments?.reduce((sum, payment) => sum + payment.paidAmount, 0)}
                                        </Typography>
                                    </td>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {item.paymentStatus === 'Paid' ? <CheckBadgeIcon className='w-6 h-6 mb-1 text-green-600 inline' /> : null}
                                        </Typography>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tr className="bg-gray-50">
                        <td className="px-4 py-2 order-t font-medium text-blue-gray-700">
                            Totals:
                        </td>
                        <td></td>
                        <td></td>
                        <td className="px-4 py-2 border-t font-medium text-blue-gray-700">
                            {invoices.reduce((sum, item) => sum + item.totalAmount - totalInvoiceTaxAmount(item), 0).toFixed(2)}
                        </td>

                        <td className="px-4 py-2 border-t font-medium text-blue-gray-700">
                            {(taxTotals.reduce((sum, tax) => sum + tax, 0)).toFixed(2)}
                        </td>

                        <td className="px-4 py-2 border-t font-medium text-blue-gray-700">
                            {invoices.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                        </td>

                        <td className="px-4 py-2 border-t font-medium text-blue-gray-700">
                            {(
                                invoices.reduce((sum, item) => sum + item.totalAmount, 0) -
                                invoices.reduce(
                                    (sum, item) =>
                                        sum + (item.Payments?.reduce((s, p) => s + p.paidAmount, 0) || 0),
                                    0
                                )
                            ).toFixed(2)}
                        </td>
                    </tr>
                </table>

                {/* Summary */}
                {/* <div className="mt-10 border border-gray-400 p-4 rounded-md w-full justify-start max-w-md mr-auto">
                    <h2 className="text-lg font-semibold text-center mb-2">{state.business.name}</h2>
                    <div className="grid grid-cols gap-y-2 gap-x-4 text-sm border-t border-gray-300 pt-2">
                    <div className='flex justify-between'>
                        <span className="font-medium">Taxable sales parts:</span>
                        <span className="text-right">{taxablePartsTotal.toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className="font-medium">Non-taxable sales labour:</span>
                        <span className="text-right">{nonTaxableLabourTotal.toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className="font-medium">Non-taxable sales - wholesales:</span>
                        <span className="text-right">{nonTaxableWholeSaleTotal.toFixed(2)}</span>
                    </div>
                        {taxTotals.map((total, idx) => (
                            <div key={idx} className='flex justify-between'>
                                <span className="font-medium">{total.name} collected:</span>
                                <span className="text-right">{total.value.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t mt-3 pt-2 font-bold text-md flex justify-between">
                        <span>Gross Monthly Sales:</span>
                        {invoices.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                    </div>
                </div> */}
            </div>
        </div>
    );
});

export default CustomerReportPreview;
