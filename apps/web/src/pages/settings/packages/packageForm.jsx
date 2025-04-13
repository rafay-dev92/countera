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

            // const productTaxes = {};

            // selectedProd.forEach((product) => {
            //     product.Tax?.forEach((productTax) => {
            //         const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

            //         if (!productTaxes[key]) {
            //             productTaxes[key] = 0;
            //         }

            //         if (productTax.type === "%") {
            //             productTaxes[key] += product.price * product.quantity * (productTax.rate / 100);
            //         } else {
            //             productTaxes[key] += product.quantity * productTax.rate;
            //         }
            //     });
            // });
            // setAppliedTaxes(productTaxes);
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

        updatedItems.forEach((item, i) => {
            if (i !== updatedItems.length - 1) {
                item.quantity = Number(quantity);
            }
        });
        // updatedItems[index].quantity = Number(quantity);
        
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

    return (
        <>
            <Dialog open={open} >
                {open && (
                    <form autoComplete="new">
                        <div className="flex justify-center w-full">
                            {/* <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center"> */}
                                <div className="bg-white rounded shadow-xl w-full">
                                    <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                                        <div></div>
                                        <div className="text-white text-center text-lg">
                                            {edit ? "EDIT PACKAGE" : "NEW PACKAGE"}
                                        </div>
                                        <button
                                            className=" bg-transparent hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
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

                                    <div className="p-6 space-y-4 w-full overflow-y-auto">
                                        <div className="flex items-center justify-start space-x-4 w-full">
                                            <div className="w-full">
                                                <label className="font-bold">Name</label> <br />
                                                <input
                                                    className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    value={values.name}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                />
                                                {(touched.name && errors.name) ? (
                                                    <div className="text-red-500">
                                                        {errors.name}
                                                    </div>
                                                ) : (<div></div>)}
                                            </div>
                                            {/* <div className="basis-[50%]">
                                                <label className="font-bold">Quantity Of Each</label> <br />
                                                <input
                                                    className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
                                                    id="quantity"
                                                    name="quantity"
                                                    min={1}
                                                    type="number"
                                                    value={values.quantity}
                                                    onChange={(e) => {setFieldValue("quantity", e.target.value); handleQuantityChange(index, e.target.value)}}
                                                    onBlur={handleBlur}
                                                />
                                                {(touched.quantity && errors.quantity) ? (
                                                    <div className="text-red-500">
                                                        {errors.quantity}
                                                    </div>
                                                ) : (<div></div>)}
                                            </div> */}
                                        </div>
                                        <div className="flex items-center justify-start space-x-4">
                                            <div className="w-full">
                                                <label className="font-bold">Description</label> <br />
                                                <textarea
                                                    rows={3}
                                                    className="w-full p-2 border border-gray-300 rounded-md text-black font-medium"
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
                                        <div className="overflow-auto max-h-48">
                                        <table className="w-full border border-collapse table-auto mb-16">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="p-2 border">Product</th>
                                                    <th className="p-2 border">Quantity</th>
                                                    <th className="p-2 border">Price</th>
                                                    <th className="p-2 border">Total</th>
                                                    <th className="p-2 border">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="max-h-48 overflow-y-auto">
                                                {selectedProducts.map((item, index) => (
                                                    <tr key={index} className="text-center">
                                                        <td className="p-2 border">
                                                            {index !== (selectedProducts.length - 1) ? (
                                                                <div className="text-left">{item.name}</div>
                                                            ) : (
                                                                <div ref={productInputRef} className="relative">
                                                                    <input
                                                                        className="w-full p-2 border border-gray-300 rounded-md text-gray-600"
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
                                                                        <ul className="absolute z-50 bg-white border border-slate-700 w-full mt-1 overflow-y-auto max-h-48">
                                                                            {products?.length > 0 ? (
                                                                                products
                                                                                    .filter(product => product.name.toLowerCase().includes(productSearchText.toLowerCase()))
                                                                                    .map((product) => (
                                                                                        <li
                                                                                            key={product.id}
                                                                                            className="cursor-pointer px-2 py-1 hover:bg-gray-200"
                                                                                            onClick={() => {
                                                                                                handleProductChange(index, item.quantity, product.id);
                                                                                                setShowProductSuggestions(false);
                                                                                            }}
                                                                                        >
                                                                                            {product.name}
                                                                                        </li>
                                                                                    ))
                                                                            ) : (
                                                                                <li className="px-2 py-1">No Product</li>
                                                                            )}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="p-2 border">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            className="w-20 p-2 border rounded-md text-black text-center"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        />
                                                    </td>

                                                        <td className="p-2 border">{item.price}</td>

                                                        <td className="p-2 border">{calculateAmount(item.price, item.quantity)}</td>

                                                        <td className="p-2 border">
                                                            {index !== (selectedProducts.length - 1) && (
                                                                <XCircleIcon
                                                                    onClick={() => handleRemoveProduct(index)}
                                                                    className="h-5 w-5 mx-auto text-gray-600 hover:text-red-500 cursor-pointer"
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                                            onClick={() => onSubmit(values)}
                                            className="w-32 bg-gray-600 hover:bg-gray-900 text-white font-bold py-2 px-4"
                                            type="submit"
                                        >
                                            {!isLoading ?
                                                <span>{edit ? "Update" : "Save"}</span> :
                                                <div className="flex items-center justify-center h-fit">
                                                    <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            }
                                        </button>
                                    </div>
                                </div>
                            {/* </div> */}
                        </div>
                    </form>
                )}
            </Dialog>
        </>
    );
}

export default PackageForm;