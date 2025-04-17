import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Dialog } from "@material-tailwind/react";
import { fetchInvoices } from "@/services/fetchInvoices";
import { fetchCustomers } from "@/services/fetchCustomers";
import { fetchProducts } from "@/services/fetchProducts";

const schema = Yup.object().shape({
    product: Yup.string().required("Product is required"),
});

function ProductSalesForm({ open, close, setReportData }) {
    const productInputRef = useRef();
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    const handleClose = () => {
        setSelectedProduct(null)
        clearForm(formikProps);
        close();
    };

    const showToastMessage = (type, message) => {

        if (type === 'success') {
            toast.success(message)
        }
        else if (type === 'info') {
            toast.info(message)
        }
        else {
            toast.error(message)
        }
    };

    const onSubmit = async (values) => {
        setIsLoading(true);
        try {
            const filters = {paymentStatus: ['Paid', 'Partially Paid', 'Unpaid'], isReport: true, order: 'ASC'}

            const fetchedInvoices = await fetchInvoices(state.userToken, null, null, filters);
            const totalInvoices = await fetchedInvoices.json();
            console.log(totalInvoices);
            if (totalInvoices?.data?.length === 0) {
                showToastMessage('info', 'No invoices found for this customer');
                setIsLoading(false);
                return;
            }
            setReportData(totalInvoices?.data);
            setIsLoading(false);
            handleClose();
        } catch (error) {
            console.log(error)
            setIsLoading(false);
            showToastMessage('error', 'Something went wrong');
            handleClose();
        }
    };

    const getProducts = async () => {
        const fetchedProducts = await fetchProducts(state.userToken);
        const productsData = await fetchedProducts.json();
        setProducts(productsData);
    };

    useEffect(() => {
        getProducts();
    }, []);

    const handleProductChange = (product) => {
        setSelectedProduct(product);
        if (product) {
            setValues({ ['product']: product.id });
        };
        setShowProductSuggestions(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (productInputRef.current && !productInputRef.current.contains(event.target)) {
                setShowProductSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                product: '',
            },
            errors: {
                product: '',
            },
        });
        setSelectedProduct(null);
    };

    const formikProps = useFormik({
        initialValues: {
            product: '',
        },
        validationSchema: schema,
        onSubmit,
    });

    const {
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setValues,
    } = formikProps;

    return (
        <>
            <Dialog open={open} size="xs">
                {open && (
                    <form onSubmit={handleSubmit} autoComplete="new" >
                        <div className="flex justify-center w-full">
                            <div className="bg-white rounded shadow-xl">
                                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <div></div>
                                    <div className="text-lg text-white font-medium" >
                                        Product Sales Report
                                    </div>
                                    <button
                                        className="bg-transparent hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                                        onClick={handleClose}
                                        type="button"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="w-6 h-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="w-[25vw] p-6 space-y-4">
                                    <div className="relative flex flex-col" ref={productInputRef}>
                                        <label className="font-bold">Product</label>
                                        <input
                                            className="relative h-[97%] mt-1 p-2 border border-gray-300 rounded-md text-gray-600 font-small focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="product"
                                            name="product"
                                            type="text"
                                            value={selectedProduct ? `${selectedProduct.name}` : values.product}
                                            onClick={() => { setShowProductSuggestions(true); setValues({ ['product']: '' }) }}
                                            onChange={(e) => { setSelectedProduct(null); handleChange(e) }}
                                            onBlur={handleBlur}
                                            autoComplete="off"
                                            placeholder="Select Product"
                                        />
                                        {showProductSuggestions && (
                                            <ul className="d-block absolute z-50 bg-white border border-slate-700 w-full top-full mt-1 overflow-y-auto min-h-24 max-h-48 ">
                                                {products.length > 0 ?
                                                    products
                                                        .filter(product => {
                                                            const searchTerm = values.product.trim().toLowerCase();
                                                            return (
                                                                `${product.name}`.toLowerCase().includes(searchTerm) ||
                                                                product.Category.name?.toLowerCase().includes(searchTerm)
                                                            );
                                                        })
                                                        .map(product => (
                                                            <li
                                                                key={product.id}
                                                                className="cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-200"
                                                                onClick={() => handleProductChange(product)}
                                                            >
                                                                {product.name} {product.Category.name ? `(${product.Category.name})` : ''}
                                                            </li>
                                                        ))
                                                    :
                                                    <li className="px-2 py-1 rounded-sm">No Product</li>
                                                }
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-2 sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                    <button
                                        className=" w-32 bg-gray-600 hover:bg-gray-900 text-white font-bold py-2 px-4"
                                        onClick={() => clearForm(formikProps)}
                                        type="button"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        disabled={isLoading}
                                        className="w-32 bg-gray-600 hover:bg-gray-900 text-white font-bold py-2 px-4"
                                        type="submit"
                                    >
                                        {!isLoading ?
                                            <span>Generate</span>
                                            :
                                            <div className="flex items-center justify-center h-fit">
                                                <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </Dialog>
        </>
    );
}

export default ProductSalesForm;