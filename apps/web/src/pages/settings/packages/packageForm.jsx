import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "@material-tailwind/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { fetchProducts } from "@/services/fetchProducts";
import { addPackage } from "@/services/addPackage";
import { updatePackage } from "@/services/updatePackage";
import { XCircleIcon } from "@heroicons/react/24/outline";

const schema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    // quantity: Yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
    description: Yup.string(),
});

function PackageForm({ packageData, setPackageData, open, close, refresh, setRefresh }) {
    const productInputRef = useRef();
    const { state } = State();
    const [isLoading, setIsLoading] = useState(false);
    const [edit, setEdit] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([{
        product: "",
        quantity: 1,
        price: 0,
        taxable: false
    }]);
    const [productSearchText, setProductSearchText] = useState("");
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const [appliedTaxes, setAppliedTaxes] = useState({});

    const [productsPosition, setProductsPosition] = useState({ top: 0, left: 0, width: 0 })

    useEffect(() => {
        if (packageData) {
            const data = {
                name: packageData.name,
                description: packageData.description,
            }
            formikProps.setValues(data);
            let selectedProd = [...selectedProducts]
            packageData?.Product?.forEach((prod) => {
                const aProd = {
                    product: prod.id,
                    id: prod.id,
                    name: prod.name,
                    price: prod.price,
                    quantity: prod.package_product.quantity,
                    taxable: prod.taxable,
                    Tax: prod.Tax,
                }
                selectedProd = [aProd, ...selectedProd];
            })

            setSelectedProducts(selectedProd);
            setEdit(true);
        }
    }, [packageData]);

    const handleClose = () => {
        clearForm(formikProps);
        setEdit(false);
        setPackageData(null);
        close();
    };

    const onSubmit = async (values) => {
        setIsLoading(true);
        const updatedData = { ...values, BusinessId: state.business.id }

        // remove the last empty product
        // selectedProducts.pop();
        const updatedProducts = selectedProducts.slice(0, selectedProducts.length - 1);
        // check if the product is empty
        if (updatedProducts.length === 0) {
            toast.error("Please select a product");
            setIsLoading(false);
            return;
        }

        const selectedProductIds = updatedProducts.map((product) => `${product.id}:${product.quantity}`);
        const data = {
            packageData: updatedData,
            products: selectedProductIds,
        }
        try {
            if (!edit) {
                const res = await addPackage(data, state.userToken);
                const tax = await res.json();
                if (res.status === 200) {
                    toast.success(tax.message)
                }
                else if (res.status === 409) {
                    toast.error(tax.message)
                }
            }
            else {
                const res = await updatePackage(packageData.id, data, state.userToken);
                const tax = await res.json();
                if (res.status === 200) {
                    toast.success(tax.message)
                }
                else if (res.status === 404) {
                    toast.info(tax.message)
                }
                else if (res.status === 409) {
                    toast.error(tax.message)
                }
            }

            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
            setRefresh(!refresh);
            setIsLoading(false);
            handleClose();
        }
    };

    // get products
    const getProducts = async () => {
        try {
            const fetchedProducts = await fetchProducts(state.userToken);
            const productsData = await fetchedProducts.json();
            setProducts(productsData);
        } catch (error) {
            console.log(error.message);
            toast('Something went wrong');
        }
    };

    useEffect(() => {
        getProducts();
    }, []);

    // Handle product change
    const handleProductChange = async (index, quantity, selectedProId) => {
        const updatedItems = [...selectedProducts];

        // Check if the selected product already exists in the list
        const existingProductIndex = selectedProducts.findIndex(
            (prod) => prod.id === selectedProId
        );

        if (existingProductIndex !== -1) {
            // If the product already exists, update its quantity
            handleQuantityChange(existingProductIndex, selectedProducts[existingProductIndex].quantity + quantity);
            updatedItems[index].product = ""; // Reset the current row
            setSelectedProducts(updatedItems);
            return;
        }

        // Find the selected product details
        const selectedProductDetails = products.find((product) => product.id === selectedProId);
        if (selectedProductDetails) {
            updatedItems[index] = {
                id: selectedProductDetails.id,
                product: selectedProId,
                name: selectedProductDetails.name,
                quantity: updatedItems[index].quantity,
                price: selectedProductDetails.price,
                taxable: selectedProductDetails.taxable,
                Tax: selectedProductDetails.Tax,
            };
        } else {
            // Reset the row if no product is found
            updatedItems[index] = {
                id: "",
                product: "",
                name: "",
                quantity: 1,
                price: 0,
                taxable: false,
                Tax: [],
            };
        }

        // Recalculate taxes
        // recalculateTaxes(updatedItems);

        // Add a new empty row if it's the last row and a product is selected
        const isLastRow = index === selectedProducts.length - 1;
        if (isLastRow && selectedProId) {
            updatedItems.push({
                id: "",
                product: "",
                name: "",
                quantity: 1,
                price: 0,
                taxable: false,
                Tax: [],
            });
        }

        setSelectedProducts(updatedItems);
        setProductSearchText("");
    };

    // Handle quantity change
    const handleQuantityChange = (index, quantity) => {
        const updatedItems = [...selectedProducts];

        // updatedItems.forEach((item, i) => {
        //     if (i !== updatedItems.length - 1) {
        //         item.quantity = Number(quantity);
        //     }
        // });
        updatedItems[index].quantity = Number(quantity);

        // Recalculate taxes
        // recalculateTaxes(updatedItems);

        setSelectedProducts(updatedItems);
    };

    // Handle removing a product
    const handleRemoveProduct = (index) => {
        const updatedItems = [...selectedProducts];
        updatedItems.splice(index, 1);

        // Recalculate taxes if there are remaining items
        // if (updatedItems.length > 0) {
        //     recalculateTaxes(updatedItems);
        // } else {
        //     setAppliedTaxes({});
        // }

        setSelectedProducts(updatedItems);
    };

    // Recalculate taxes
    // const recalculateTaxes = (products) => {
    // if (!selectedCustomer?.taxable) {
    //     setAppliedTaxes({});
    //     return;
    // }

    //     const productTaxes = {};

    //     products.forEach((product) => {
    //         product.Tax?.forEach((productTax) => {
    //             const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

    //             if (!productTaxes[key]) {
    //                 productTaxes[key] = 0;
    //             }

    //             if (productTax.type === "%") {
    //                 productTaxes[key] += product.price * product.quantity * (productTax.rate / 100);
    //             } else {
    //                 productTaxes[key] += product.quantity * productTax.rate;
    //             }
    //         });
    //     });
    //     setAppliedTaxes(productTaxes);
    // };

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

    // calculate amount
    const calculateAmount = (price, quantity) => {
        return price * quantity;
    };

    const clearForm = (formikProps) => {
        formikProps.resetForm({
            values: {
                name: "",
                // quantity: 1,
                description: "",
            },
            errors: {
                name: "",
                // quantity: 1,
                description: "",
            },
        });
        setSelectedProducts([{
            product: "",
            quantity: 1,
            price: 0,
            taxable: false
        }]);
        setProductSearchText("");
        setShowProductSuggestions(false);
        // setAppliedTaxes({});
    };

    const formikProps = useFormik({
        initialValues: {
            name: "",
            // quantity: 1,
            description: "",
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
    } = formikProps;

    useEffect(() => {
        if (showProductSuggestions && productInputRef.current) {
            const rect = productInputRef.current.getBoundingClientRect()
            setProductsPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            })
        }
    }, [showProductSuggestions, productInputRef])

    return (
        <>
            <Dialog className="bg-transparent shadow-none p-0" open={open} >
                {open && (
                    <form autoComplete="new">
                        {/* <div className="flex justify-center w-full"> */}
                        <div className="fixed -top-16 lg:top-0 left-0 w-full h-full flex justify-center items-center">
                            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                                    <div className="text-[15px] font-semibold text-slate-900">
                                        {edit ? "Edit package" : "New package"}
                                    </div>
                                    <button
                                        className=" rounded-md p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
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
                                <div className="2xl:w-[50vw] xl:w-[60vw] lg:w-[70vw] md:w-[80vw] w-[90vw] p-3 max-h-[70vh] lg:max-h-[80vh] overflow-y-auto">
                                    <div className="space-y-4 w-full overflow-y-auto ">
                                        <div className="flex items-center justify-between space-x-4 ">
                                            <div className="w-full">
                                                <label className="text-[13px] font-medium text-slate-700">Name</label> <br />
                                                <input
                                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    value={values.name}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                />
                                                {(touched.name && errors.name) ? (
                                                    <div className="mt-1 text-xs text-red-600">
                                                        {errors.name}
                                                    </div>
                                                ) : (<div></div>)}
                                            </div>
                                            {/* <div className="basis-[50%]">
                                                <label className="text-[13px] font-medium text-slate-700">Quantity Of Each</label> <br />
                                                <input
                                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                    id="quantity"
                                                    name="quantity"
                                                    min={1}
                                                    type="number"
                                                    value={values.quantity}
                                                    onChange={(e) => {setFieldValue("quantity", e.target.value); handleQuantityChange(index, e.target.value)}}
                                                    onBlur={handleBlur}
                                                />
                                                {(touched.quantity && errors.quantity) ? (
                                                    <div className="mt-1 text-xs text-red-600">
                                                        {errors.quantity}
                                                    </div>
                                                ) : (<div></div>)}
                                            </div> */}
                                        </div>
                                        <div className="flex items-center justify-start space-x-4">
                                            <div className="w-full">
                                                <label className="text-[13px] font-medium text-slate-700">Description</label> <br />
                                                <textarea
                                                    rows={3}
                                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                    id="description"
                                                    name="description"
                                                    type="text"
                                                    value={values.description}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                />
                                            </div>
                                        </div>

                                        {/* Products */}
                                        <div className="overflow-x-auto my-2">
                                            <table className="w-full border border-slate-200 border-collapse table-auto mb-16">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="border border-slate-200 p-2 text-[13px] font-semibold text-slate-700">Product</th>
                                                        <th className="border border-slate-200 p-2 text-[13px] font-semibold text-slate-700">Quantity</th>
                                                        <th className="border border-slate-200 p-2 text-[13px] font-semibold text-slate-700">Price</th>
                                                        <th className="border border-slate-200 p-2 text-[13px] font-semibold text-slate-700">Total</th>
                                                        <th className="border border-slate-200 p-2 text-[13px] font-semibold text-slate-700">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="max-h-48 overflow-y-auto">
                                                    {selectedProducts.map((item, index) => (
                                                        <tr key={index} className="text-center">
                                                            <td className="border border-slate-200 p-2 text-sm text-slate-700">
                                                                {index !== (selectedProducts.length - 1) ? (
                                                                    <div className="w-80 h-[30%] mx-2 p-1 rounded-md text-slate-700 text-sm text-left focus:outline-none "
                                                                    >{item.name}</div>
                                                                ) : (
                                                                    <div ref={productInputRef} className="relative w-fit">
                                                                        <input
                                                                            className="lg:w-80 h-9 m-2 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                                            id="product"
                                                                            name="product"
                                                                            type="text"
                                                                            value={selectedProducts[index].name || productSearchText}
                                                                            onClick={() => { setShowProductSuggestions(true) }}
                                                                            onChange={(e) => setProductSearchText(e.target.value)}
                                                                            onBlur={handleBlur}
                                                                            autoComplete="off"
                                                                            placeholder="Select Product"
                                                                        />
                                                                        {showProductSuggestions && (
                                                                            <ul className="fixed bg-white rounded-md border border-slate-200 shadow-lg overflow-y-auto min-h-24 max-h-48 lg:w-80"
                                                                                style={{
                                                                                    top: productsPosition.top,
                                                                                    left: productsPosition.left,
                                                                                    width: productsPosition.width,
                                                                                    zIndex: 9999,
                                                                                }}
                                                                            >
                                                                                {products?.length > 0 ? (
                                                                                    products
                                                                                        .filter(product => product.name.toLowerCase().includes(productSearchText.toLowerCase()))
                                                                                        .map((product) => (
                                                                                            <li
                                                                                                key={product.id}
                                                                                                className="cursor-pointer px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                                                                                                onClick={() => {
                                                                                                    handleProductChange(index, item.quantity, product.id);
                                                                                                    setShowProductSuggestions(false);
                                                                                                }}
                                                                                            >
                                                                                                {product.name}
                                                                                            </li>
                                                                                        ))
                                                                                ) : (
                                                                                    <li className="px-2 py-1 text-sm text-slate-500">No Product</li>
                                                                                )}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td className="border border-slate-200 p-2">
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    className="w-14 rounded-md border border-slate-300 bg-white p-1.5 text-center text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                />
                                                            </td>

                                                            <td className="w-24 border border-slate-200 p-2 text-sm text-slate-700">{item.price}</td>

                                                            <td className="border border-slate-200 p-2 text-sm text-slate-700">{calculateAmount(item.price, item.quantity)}</td>

                                                            <td className="border border-slate-200 p-2">
                                                                {index !== (selectedProducts.length - 1) && (
                                                                    <XCircleIcon
                                                                        onClick={() => handleRemoveProduct(index)}
                                                                        className="h-5 w-5 mx-auto text-slate-500 hover:text-red-600 cursor-pointer"
                                                                    />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
                                    <button
                                        className="w-auto rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60"
                                        onClick={() => clearForm(formikProps)}
                                        type="button"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        disabled={isLoading}
                                        onClick={() => onSubmit(values)}
                                        className="w-28 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                                        type="submit"
                                    >
                                        {!isLoading ?
                                            <span>{edit ? "Update" : "Save"}</span> :
                                            <div className="flex items-center justify-center h-fit">
                                                <div className="w-6 h-6 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
                                            </div>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* </div> */}
                    </form>
                )}
            </Dialog>
        </>
    );
}

export default PackageForm;