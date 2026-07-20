import React, { useEffect, useState } from 'react';
import { Typography } from "@material-tailwind/react";
import { State } from '@/state/Context';
import { StarIcon } from '@heroicons/react/24/solid';

interface MonthlyReportPreviewProps {
    filterValue: string;
    invoices: any[];
    productsCategories: string[];
    taxes: string[];
}

const MonthlyReportPreview = React.forwardRef<HTMLDivElement, MonthlyReportPreviewProps>(({ filterValue, invoices, productsCategories, taxes }, ref) => {
    // const productsCategoriesPrices = productsCategories.map(category => { return `${category} Price` });
    const INVOICE_TABLE_HEAD = ["Date", "Invoice", "Paid By", "Total", "Paid", ...productsCategories, ...taxes];
    const { state } = State();
    const business = state.business!;
    const calculateTaxes = (invoice: any, customerType: string) => {
        const productTaxes: Record<string, number> = {};
        
        invoice?.Taxes?.forEach((invoiceTax: any) => {
            if (customerType === 'business' && invoiceTax.tax_name==='Sales Tax') return;
            const key = `${invoiceTax.tax_name}_${invoiceTax.tax_rate}_${invoiceTax.tax_type}`;
            if (!productTaxes[key]) {
                productTaxes[key] = 0;
            }
            if (invoiceTax.tax_type === "%") {
                productTaxes[key] += invoiceTax.tax_amount;

            } else {
                productTaxes[key] += invoiceTax.tax_amount;
            }
        });        
        return productTaxes;
    };

    const productTotals = productsCategories.map(category =>
        invoices.reduce((sum, invoice) => {
            const matchedProduct = invoice.Products ? invoice.Products.filter((p: any) => p.Category?.name === category) : {};
            const isLaborCategory = category?.toLowerCase() === 'labor' || category?.toLowerCase() === 'labour';

            if (isLaborCategory && matchedProduct.length === 0) {
                return sum + (invoice?.labour || 0);
            }
            let totalPrice = 0;
            matchedProduct.forEach((product: any) => {
                totalPrice += product.invoice_product.price * product.invoice_product.quantity;
            });
            return sum + totalPrice;
        }, 0)
    );

    const productQuantities = productsCategories.map(category =>
        invoices.reduce((sum, invoice) => {
            const matchedProduct = invoice.Products ? invoice.Products.filter((p: any) => p.Category?.name === category) : {};
            const isLaborCategory = category?.toLowerCase() === 'labor' || category?.toLowerCase() === 'labour';
            if (isLaborCategory && matchedProduct.length === 0) {
                return sum + 1;
            }
            let quantity = 0;
            matchedProduct.forEach((product: any) => {
                quantity += product.invoice_product.quantity;
            });
            return sum + quantity;
        }, 0)
    );

    const taxTotals = taxes.map(tax => {
        const value = invoices.reduce((sum, invoice) => {
            const productTaxes = calculateTaxes(invoice, invoice.Customer?.customerType);
            const matchingKey = Object.keys(productTaxes)?.find(key => key.split('_')[0] === tax);
            return sum + (matchingKey ? productTaxes[matchingKey] || 0 : 0);
        }, 0);
        return { name: tax, value };
    });

    const taxablePartsTotal = invoices.reduce((sum, invoice) => {
        const isCustomerTaxExempt = invoice.Customer?.customerType === 'business';
        if (isCustomerTaxExempt) return sum;
        const matchedProducts = invoice.Products?.filter((p: any) => p.taxable) || [];
        matchedProducts.forEach((matchedProduct: any) => {
            const quantity = matchedProduct?.invoice_product?.quantity || 0;
            const price = matchedProduct?.price || 0;
            sum += price * quantity;
        });
        return sum;
    }, 0);

    const nonTaxableWholeSaleTotal = invoices.reduce((sum, invoice) => {
        const isCustomerTaxExempt = invoice.Customer?.customerType === 'business';
        if (!isCustomerTaxExempt) return sum;
        const matchedProducts = invoice.Products?.filter((p: any) => p.taxable) || [];
        matchedProducts.forEach((matchedProduct: any) => {
            const quantity = matchedProduct?.invoice_product?.quantity || 0;
            const price = matchedProduct?.price || 0;
            sum += price * quantity;
        });
        return sum;
    }, 0);

    const nonTaxableLabourTotal = invoices.reduce((sum, invoice) => {
        const matchedProducts = invoice.Products?.filter((p: any) => !p.taxable);
        matchedProducts.forEach((matchedProduct: any) => {
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
                        <h3 className="text-2xl font-bold mb-3">{business.name}</h3>
                        <div className="flex flex-col items-start justify-start">
                            <span className="text-sm font-normal text-black">{business.address}</span>
                            <span className="text-sm font-normal text-black">{business.city}, {business.state}, {business.zipcode}</span>
                            <span className="text-sm font-normal text-black">Phone: {business.tel}</span>
                            <span className="text-sm font-normal text-black">Fax: {business.fax}</span>
                            <span className="text-sm font-normal text-black">Email: {business.email}</span>
                        </div>
                    </div>
                    <img src={business.logo as string} className="rounded-xl h-[100px] w-[100px]" alt="Business logo" width={100} height={100} />
                </div>
            </div>
            <div className='w-full p-2'>
                <table className="w-full">
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
                    <tbody>
                        {invoices?.map((item, index) => {
                            const productTaxes = calculateTaxes(item, item.Customer?.customerType);
                            const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                                timeZone: business.timezone ? business.timezone : '',
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
                                            {item.Customer?.customerType === 'business' ? <StarIcon className='w-3.5 h-3.5 mb-1 text-teal-700 inline' /> : null} {formattedDate}
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
                                            {item.Payments.map((payment: any) => (
                                                <div key={payment.id} className="text-sm leading-5 text-blue-gray-700 whitespace-nowrap">
                                                    <span className="font-medium">{payment?.paymentMethod}:</span> {payment?.paidAmount}
                                                </div>
                                            ))}
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
                                            className="font-normal leading-none"
                                        >
                                            <div className="text-sm leading-5 text-blue-gray-700 whitespace-nowrap">
                                                <div><span className="font-medium">Paid:</span> {item.paidAmount}</div>
                                                <div><span className="font-medium">Balance:</span> {(item.totalAmount - item.paidAmount).toFixed(2)}</div>
                                            </div>
                                        </Typography>
                                    </td>
                                    {productsCategories.map((category, idx) => {
                                        const isLaborCategory = category?.toLowerCase() === 'labor' || category?.toLowerCase() === 'labour';
                                        const matchedProduct = item.Products?.filter((item: any) => item.Category?.name === category);

                                        let totalPrice = 0, quantity = 0;
                                        if (isLaborCategory && matchedProduct.length === 0) {
                                            totalPrice = item.labour || 0;
                                            quantity = 1;
                                        } else if (matchedProduct.length > 0) {
                                            matchedProduct.forEach((product: any) => {
                                                totalPrice += product.invoice_product.price * product.invoice_product.quantity;
                                                quantity += product.invoice_product.quantity;
                                            });
                                        }
                                        
                                        return (
                                            <td key={idx} className="p-4 border-b border-blue-gray-50">
                                                <Typography
                                                    variant="small"
                                                    color="blue-gray"
                                                    className="font-normal leading-none"
                                                >
                                                    <div className="text-sm leading-5 text-blue-gray-700 whitespace-nowrap">
                                                        <div><span className="font-medium">Quantity:</span> {quantity}</div>
                                                        <div><span className="font-medium">Total:</span> {totalPrice.toFixed(2)}</div>
                                                    </div>
                                                </Typography>
                                            </td>
                                        )
                                    })}                                    
                                    {taxes.map((tax, idx) => {
                                        const matchingKey = Object.keys(productTaxes)?.find(key => key.split('_')[0] === tax);
                                        const value = matchingKey ? productTaxes[matchingKey] || 0 : 0;
                                        const taxType = matchingKey ? matchingKey.split('_')[2] : '';
                                        return (
                                            <td key={idx} className="p-4 border-b border-blue-gray-50 bg-blue-100">
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
                        <tr className="bg-gray-100">
                            <td></td>
                            <td></td>
                            <td className="p-4 border-t font-semibold text-blue-gray-700">
                                {!filterValue || filterValue === "" ?
                                    invoices.reduce((sum, invoice) =>
                                        sum + invoice.Payments.reduce((acc: number, payment: any) => acc + payment.paidAmount, 0)
                                        , 0).toFixed(2)
                                    :
                                    invoices.reduce((sum, invoice) =>
                                        sum + invoice.Payments.reduce((acc: number, payment: any) => acc + (payment.paymentMethod === filterValue ? payment.paidAmount : 0), 0)
                                        , 0).toFixed(2)
                                }
                            </td>

                            <td className="p-4 border-t font-semibold text-blue-gray-700">
                                {invoices.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                            </td>

                            <td className="p-4 border-t font-semibold text-blue-gray-700">
                                Paid: {invoices.reduce((sum, item) => sum + item.paidAmount, 0).toFixed(2)}
                            </td>

                            {productTotals.map((total, idx) => (
                                <td key={idx} className="p-4 border-t font-semibold text-blue-gray-700">
                                    ${total.toFixed(2)}
                                </td>
                            ))}

                            {taxTotals.map((total, idx) => (
                                <td key={idx} className="p-4 border-t font-semibold text-blue-gray-700">
                                    ${total.value.toFixed(2)}
                                </td>
                            ))}
                        </tr>

                        {/* Second row for further details */}
                        <tr className="bg-gray-100">
                            <td></td>
                            <td></td>
                            <td className="p-4 border-t font-semibold text-blue-gray-700">
                                {/* {!filterValue || filterValue === "" ?
                                    invoices.reduce((sum, invoice) =>
                                        sum + invoice.Payments.reduce((acc: number, payment: any) => acc + payment.paidAmount, 0)
                                        , 0).toFixed(2)
                                    :
                                    invoices.reduce((sum, invoice) =>
                                        sum + invoice.Payments.reduce((acc: number, payment: any) => acc + (payment.paymentMethod === filterValue ? payment.paidAmount : 0), 0)
                                        , 0).toFixed(2)
                                } */}
                                --
                            </td>

                            <td className="p-4 border-t font-semibold text-blue-gray-700">
                                --
                            </td>
                            <td className="p-4 border-t font-semibold text-blue-gray-700">
                                Balance: {invoices.reduce((sum, item) => sum + item.totalAmount - item.paidAmount, 0).toFixed(2)}
                            </td>

                            {productQuantities.map((total, idx) => (
                                <td key={idx} className="p-4 border-t font-semibold text-blue-gray-700">
                                    {`${total} units`}
                                </td>
                            ))}

                            {taxTotals.map((_, idx) => (
                                <td key={idx} className="p-4 border-t font-semibold text-blue-gray-700">
                                    --
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>

                {/* Summary */}
                <div className="mt-10 border border-gray-400 p-4 rounded-md w-full justify-start max-w-md mr-auto">
                    <h2 className="text-lg font-semibold text-center mb-2">{business.name}</h2>
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
                </div>
            </div>
        </div>
    );
});

export default MonthlyReportPreview;
