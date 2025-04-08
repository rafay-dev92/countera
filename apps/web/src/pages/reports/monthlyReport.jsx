import React, { useEffect, useState } from 'react';
import { Typography } from "@material-tailwind/react";
import { State } from '@/state/Context';

const MonthlyReportPreview = React.forwardRef(({ invoices, products, taxes }, ref) => {
    const INVOICE_TABLE_HEAD = ["Date", "Invoice", "Total", ...products, ...taxes];

    const { state } = State();
    const calculateTaxes = (products) => {
        const productTaxes = {};

        products.forEach((product) => {
            product.Tax?.forEach((productTax) => {
                const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

                if (!productTaxes[key]) {
                    productTaxes[key] = 0;
                }

                if (productTax.type === "%") {
                    productTaxes[key] += product.price * product.invoice_product.quantity * (productTax.rate / 100);
                } else {
                    productTaxes[key] += product.invoice_product.quantity * productTax.rate;
                }
            });
        });
        return productTaxes;
    };

    const productTotals = products.map(product =>
        invoices.reduce((sum, invoice) => {
            const matchedProduct = invoice.Product?.find(p => p.name === product);
            return sum + (matchedProduct?.invoice_product?.quantity || 0);
        }, 0)
    );

    const taxTotals = taxes.map(tax =>
        invoices.reduce((sum, invoice) => {
            const productTaxes = calculateTaxes(invoice.Product);
            const matchingKey = Object.keys(productTaxes)?.find(key => key.split('_')[0] === tax);
            return sum + (matchingKey ? productTaxes[matchingKey] || 0 : 0);
        }, 0)
    );

    return (
        <div ref={ref} className="p-6 text-black bg-white hidden print:block">
            <h1 className="text-3xl font-bold text-center mb-4">Monthly Sales Report</h1>
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
                            const productTaxes = calculateTaxes(item.Product);
                            return (
                                <tr key={index}>
                                    <td className="p-4 border-b border-blue-gray-50">
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal leading-none"
                                        >
                                            {item.createdAt.split("T")[0]}
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
                                            {item.totalAmount}
                                        </Typography>
                                    </td>
                                    {products.map((product, idx) => (
                                        <td key={idx} className="p-4 border-b border-blue-gray-50">
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal leading-none"
                                            >
                                                {item.Product?.find(item => item.name === product)?.invoice_product?.quantity || 0}
                                            </Typography>
                                        </td>
                                    ))}
                                    {taxes.map((tax, idx) => {
                                        const matchingKey = Object.keys(productTaxes)?.find(key => key.split('_')[0] === tax);
                                        const value = matchingKey ? productTaxes[matchingKey] || 0 : 0;
                                        const taxType = matchingKey ? matchingKey.split('_')[2] : '';
                                        return (
                                            <td key={idx} className="p-4 border-b border-blue-gray-50">
                                                <Typography
                                                    variant="small"
                                                    color="blue-gray"
                                                    className="font-normal leading-none"
                                                >
                                                    {taxType === '%' ? value.toFixed(2) : value}
                                                </Typography>
                                            </td>
                                        );
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                    <tr className="bg-gray-100">
                        <td></td>
                        <td></td>

                        <td className="p-4 border-t font-semibold text-blue-gray-700">
                            {invoices.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                        </td>

                        {productTotals.map((total, idx) => (
                            <td key={idx} className="p-4 border-t font-semibold text-blue-gray-700">
                                {total}
                            </td>
                        ))}

                        {taxTotals.map((total, idx) => (
                            <td key={idx} className="p-4 border-t font-semibold text-blue-gray-700">
                                {total.toFixed(2)}
                            </td>
                        ))}
                    </tr>
                </table>
            </div>
        </div>
    );
});

export default MonthlyReportPreview;
