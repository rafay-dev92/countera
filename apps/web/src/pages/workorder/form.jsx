import React from "react";
import { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Card,
  Typography,
  CardBody,
  Dialog,
  IconButton,
} from "@material-tailwind/react";
import {
  XCircleIcon
} from "@heroicons/react/24/outline";
import { fetchProducts } from "@/services/fetchProducts";
import { fetchCustomers } from "@/services/fetchCustomers";
import { fetchTaxes } from "@/services/fetchTaxes";
import PrintView from "./printView";
import ReactToPrint from "react-to-print";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import CustomerVehicleForm from "../customer/customerVehicleForm";
import { fetchCustomer } from "@/services/fetchCustomer";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import CustomerForm from "../invoice/customerForm";
import { updateCustomerVehicle } from "@/services/updateCustomerVehicle";
import { addWorkOrder } from "@/services/addWorkOrder";
import { updateWorkOrder } from "@/services/updateWorkOrder";
import ViewWorkOrder from "./viewWorkOrder";

const TABLE_HEAD = [
  "Product",
  "Quantity",
  "Price",
  "Tax",
  "Amount",
  "Action"
]

const schema = Yup.object().shape({
  customer: Yup.string().required("Customer is required"),
  vehicle: Yup.string().required("Vehicle is required"),
  comments: Yup.string(),
});

const MyPopUpForm = ({ refresh, setRefresh, open, close, selectedWorkOrder, setSelectetWorkOrder }) => {
  const componentRef = useRef();
  const printRef = useRef();
  const customerInputRef = useRef();
  const productInputRef = useRef();

  const { state, dispatch } = State();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [taxes, setTaxes] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([{
    product: "",
    quantity: 1,
    price: 0,
    taxable: false
  }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [invoiceId, setInvoiceId] = useState('');
  const [edit, setEdit] = useState(false);
  const [printWorkOrder, setPrintWorkOrder] = useState([]);
  const [appliedTaxes, setAppliedTaxes] = useState({});
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [vehicleOdometer, setVehicleOdometer] = useState('');

  // customer vehicle form
  const [isCustomerVehicleFormOpen, setIsCustomerVehicleFormOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);

  // product suggestions
  const [productSearchText, setProductSearchText] = useState("");

  const closeCustomerVehicleForm = () => {
    setIsCustomerVehicleFormOpen(false);
  };

  const closeCustomerForm = () => {
    setIsCustomerFormOpen(false);
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

  // close popup
  const handleClose = () => {
    setSelectedCustomer(null)
    setSelectedVehicle(null)
    setSelectetWorkOrder(null)
    setPrintWorkOrder([])
    setSelectedProducts([{
      product: "",
      quantity: 1,
      price: 0,
      taxable: false
    }]);
    setAppliedTaxes({});
    clearForm(formikProps);
    setEdit(false)
    setRefresh(!refresh);
    dispatch({ type: 'SET_WORKORDER_VIEW', payload: false });
    close();
  };

  // get customer details
  const getCustomerDetails = async () => {
    try {
      const customer = await (await fetchCustomer(selectedCustomer?.id, state.userToken)).json();
      setSelectedCustomer(customer);
      await getCustomers();
      if (customer.Vehicle.length > 0) {
        setSelectedVehicle(customer.Vehicle[0]);
        setVehicleOdometer(customer.Vehicle[0]?.odometer);
        setValues({ ...values, ['customer']: `${customer.firstName} ${customer.lastName}`, ['vehicle']: customer.Vehicle[0]?.id });
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getProducts();
    getCustomers();
    getTaxes();
  }, [refresh]);

  useEffect(() => {
    if (selectedWorkOrder) {
      setPrintWorkOrder(selectedWorkOrder);
      setInvoiceId(selectedWorkOrder.id)
      setSelectedCustomer(selectedWorkOrder.Customer)
      setSelectedVehicle(selectedWorkOrder.CustomerVehicle)
      setVehicleOdometer(selectedWorkOrder.CustomerVehicle?.odometer)
      // setProducts(selectedInvoice.Product)
      setValues({ ...selectedWorkOrder, ['customer']: selectedWorkOrder.CustomerId, ['vehicle']: selectedWorkOrder.CustomerVehicleId })
      setEdit(true)

      let selectedProd = [...selectedProducts]
      selectedWorkOrder.Product?.forEach((prod) => {
        const aProd = {
          product: prod.id,
          id: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: prod.workorder_product.quantity,
          taxable: prod.taxable,
          Tax: prod.Tax,
        }
        selectedProd = [aProd, ...selectedProd];
      })

      if (selectedWorkOrder?.Customer?.taxable) {
        const productTaxes = {};
        selectedProd.forEach((product) => {
          product.Tax?.forEach((productTax) => {
            const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

            if (!productTaxes[key]) {
              productTaxes[key] = 0;
            }

            if (productTax.type === "%") {
              productTaxes[key] += product.price * product.quantity * (productTax.rate / 100);
            } else {
              productTaxes[key] += product.quantity * productTax.rate;
            }
          });
        });
        setAppliedTaxes(productTaxes);
      }
      setSelectedProducts(selectedProd);
      // setSelectedQuotation(null)
    }

  }, [selectedWorkOrder])

  // handle submit
  const onSubmit = async (values) => {
    setIsLoading(true);
    const selectedProductIds = selectedProducts.map((product) => `${product.id}:${product.quantity}`);
    selectedProductIds.pop();

    // if (selectedVehicle?.odometer < vehicleOdometer) {
    //   try {
    //     const customerVehicleUpdate = await updateCustomerVehicle(selectedVehicle.id, { odometer: vehicleOdometer }, state.userToken);
    //     if (customerVehicleUpdate.status === 200) {
    //       showToastMessage('success', 'Vehicle odometer updated successfully');
    //     }
    //   } catch (error) {
    //     console.log(error)
    //   }
    // }
    const data = {
      workOrderData: {
        totalAmount: calculateTotalAmountWithTax(),
        CustomerId: selectedCustomer.id,
        CustomerVehicleId: selectedVehicle.id,
        BusinessId: null,
        comments: values.comments,
      },
      "products": selectedProductIds,
    };

    const updatedData = { ...data, workOrderData: { ...data.workOrderData, BusinessId: state.business.id } };

    try {
      if (edit) {
        const res = await updateWorkOrder(invoiceId, updatedData, state.userToken)
        const workorder = await res.json();
        setPrintWorkOrder(workorder?.data);
        if (res.status === 200) {
          showToastMessage('success', workorder.message)
        }
        else if (res.status === 404) {
          showToastMessage('info', workorder.message)
        }
        else if (res.status === 409) {
          showToastMessage('error', workorder.message)
        }
      }
      else {
        const res = await addWorkOrder(updatedData, state.userToken)
        const workorder = await res.json();
        setPrintWorkOrder(workorder?.data);
        if (res.status === 200) {
          showToastMessage('success', workorder.message)
        }
        else if (res.status === 409) {
          showToastMessage('error', workorder.message)
        }
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
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
      showToastMessage('error', 'Something went wrong');
    }
  };


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
      updatedItems[index].product = "";
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
        quantity,
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
    recalculateTaxes(updatedItems);

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
    updatedItems[index].quantity = Number(quantity);

    // Recalculate taxes
    recalculateTaxes(updatedItems);

    setSelectedProducts(updatedItems);
  };

  // Handle removing a product
  const handleRemoveProduct = (index) => {
    const updatedItems = [...selectedProducts];
    updatedItems.splice(index, 1);

    // Recalculate taxes if there are remaining items
    if (updatedItems.length > 0) {
      recalculateTaxes(updatedItems);
    } else {
      setAppliedTaxes({});
    }

    setSelectedProducts(updatedItems);
  };

  // Recalculate taxes
  const recalculateTaxes = (products) => {
    if (!selectedCustomer?.taxable) {
      setAppliedTaxes({});
      return;
    }

    const productTaxes = {};

    products.forEach((product) => {
      product.Tax?.forEach((productTax) => {
        const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

        if (!productTaxes[key]) {
          productTaxes[key] = 0;
        }

        if (productTax.type === "%") {
          productTaxes[key] += product.price * product.quantity * (productTax.rate / 100);
        } else {
          productTaxes[key] += product.quantity * productTax.rate;
        }
      });
    });

    setAppliedTaxes(productTaxes);
  };

  // calculate amount
  const calculateAmount = (price, quantity) => {
    return price * quantity;
  };

  // handle taxable change
  const handleTaxableChange = (index, isChecked) => {
    const updatedItems = [...selectedProducts];
    updatedItems[index].taxable = isChecked;
    setSelectedProducts(updatedItems);
  };

  // get customers
  const getCustomers = async () => {
    const fetchedCustomers = await fetchCustomers(state.userToken);
    const customersData = await fetchedCustomers.json();
    setCustomers(customersData);
  };

  useEffect(() => {
    if (selectedCustomer) {
      getCustomerDetails();
    }
  }, [refresh]);

  // handle customer change
  const handleCustomerChange = (customer) => {
    setSelectedCustomer(customer);
    if (customer && customer.Vehicle.length > 0) {
      setSelectedVehicle(customer.Vehicle[0]);
      setVehicleOdometer(customer.Vehicle[0]?.odometer);
      setValues({ ...values, ['customer']: `${customer.firstName} ${customer.lastName}`, ['vehicle']: customer.Vehicle[0].id })
    };
    setSelectedProducts([{
      product: "",
      quantity: 1,
      price: 0,
      taxable: false
    }]);
    setShowCustomerSuggestions(false);
  };

  // handle vehicle change
  const handleVehicleChange = (vehicleId) => {
    const foundVehicle = selectedCustomer.Vehicle.find(
      (vehicle) => `${vehicle.id}` === vehicleId
    );
    setSelectedVehicle(foundVehicle);
    setVehicleOdometer(foundVehicle.odometer);
    setValues({ ...values, ['vehicle']: vehicleId })
  };

  // calculate total amount
  const calculateTotalAmount = () => {
    let total = 0;
    selectedProducts.forEach((item) => {
      total += calculateAmount(item.price, item.quantity);
    });
    return total;
  };

  // calculate tax amount
  const calculateTotalTaxAmount = () => {
    let totalTaxAmount = 0;
    if (Object.keys(appliedTaxes).length > 0) {
      Object.keys(appliedTaxes).forEach((tax) => {
        totalTaxAmount += parseFloat(appliedTaxes[tax].toFixed(2));
      });
      return totalTaxAmount;
    }
    return 0;
  };

  // calculate total amount with tax
  const calculateTotalAmountWithTax = () => {
    return (totalAmount + calculateTotalTaxAmount()).toFixed(2);
  };

  useEffect(() => {
    const total = calculateTotalAmount();
    setTotalAmount(total);
  }, [selectedProducts]);

  // get taxes
  const getTaxes = async () => {
    try {
      const fetchedTaxes = await fetchTaxes(state.userToken);
      const taxesData = await fetchedTaxes.json();
      setTaxes(taxesData);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong")
    }
  };


  // handle customer suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (customerInputRef.current && !customerInputRef.current.contains(event.target)) {
        setShowCustomerSuggestions(false);
      }

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
        customer: "",
        vehicle: "",
        comments: "",
      },
      errors: {
        customer: "",
        vehicle: "",
        comments: "",
      },
    });
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setVehicleOdometer('');
    setSelectedProducts([{
      product: "",
      quantity: 1,
      price: 0,
      taxable: false
    }])
    setAppliedTaxes({});
  };

  const formikProps = useFormik({
    initialValues: {
      customer: "",
      vehicle: "",
      comments: "",
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

  useEffect(() => {
    if (printWorkOrder && Object.keys(printWorkOrder).length > 0) {
      dispatch({ type: 'SET_WORKORDER_VIEW', payload: true });
    }
  }, [printWorkOrder])

  return (
    <>
      <Dialog open={open} size="lg">
        {open && (
          <form onSubmit={handleSubmit}>
            <div className="">
              <div className="bg-white rounded shadow-xl">
                <div className="flex items-center justify-between sticky bg-gradient-to-br from-gray-800 to-gray-700">
                  <div></div>
                  <div className="text-white text-center text-lg">
                    {state?.workorder?.isViewOpen ? "VIEW" : edit ? "EDIT" : "NEW"} {"WORK ORDER"}
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

                {state?.workorder?.isViewOpen ? (                    
                  <ViewWorkOrder workOrderData={printWorkOrder} setWorkOrderData={setPrintWorkOrder} componentRef={componentRef} appliedTaxes={appliedTaxes} setEdit={setEdit} close={handleClose} />
                ) : (
                  <div className="overflow-y-auto h-[80vh] overflow-x-hidden p-2">
                    <div className="flex gap-4">
                      <div className="basis-[40%] max-w-[40%]">
                        <div className="relative mb-7" ref={customerInputRef}>
                          <div className="flex items-center pl-2">
                            <label className="font-bold">Customer</label>
                            <IconButton variant="text" onClick={() => setIsCustomerFormOpen(true)}>
                              <PlusCircleIcon className="h-5 w-5 text-blue-600 cursor-pointer" />
                            </IconButton>
                          </div>
                          <input
                            className="w-[70%] h-[97%] m-2 p-2 border border-gray-300 rounded-md text-gray-600 font-small"
                            id="customer"
                            name="customer"
                            type="text"
                            value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : values.customer}
                            onClick={() => { setShowCustomerSuggestions(true); setValues({ ...values, ['customer']: '' }) }}
                            onChange={(e) => { setSelectedCustomer(null); setSelectedVehicle(null); setVehicleOdometer(''), handleChange(e) }}
                            onBlur={handleBlur}
                            autoComplete="off"
                            placeholder="Select Customer"
                          />

                          {/* {(touched.customer && errors.customer) ? (
                          <div className="text-red-500">
                            {errors.customer}
                          </div>
                        ) : (<div></div>)} */}
                          {showCustomerSuggestions && (
                            <ul className="d-block absolute z-50 bg-white border border-slate-700 w-[70%] mt-1 ml-2 overflow-y-auto min-h-24 max-h-48 ">
                              {customers.length > 0 ?
                                customers.filter(customer => `${customer.firstName.toLowerCase()} ${customer.lastName.toLowerCase()}`.includes(values.customer.trim().toLowerCase())).map((customer) => (
                                  <li key={customer.id} className="cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-200" onClick={() => { handleCustomerChange(customer) }}>
                                    {customer.firstName} {customer.lastName}
                                  </li>
                                ))
                                :
                                <li className="px-2 py-1 rounded-sm">No Customer</li>
                              }
                            </ul>
                          )}
                        </div>

                        <label className="p-2 font-bold">Name</label> <br />
                        <input
                          className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                          id="email"
                          name="email"
                          type="email"
                          value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''}
                          disabled
                        /> <br />

                        <label className="p-2 font-bold">Email</label> <br />
                        <input
                          className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                          id="email"
                          name="email"
                          type="email"
                          value={selectedCustomer ? selectedCustomer.email : ''}
                          disabled
                        /> <br />

                        <label className="p-2 font-bold">Phone</label> <br />

                        <input
                          className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                          id="phone"
                          name="phone"
                          type="text"
                          value={selectedCustomer ? selectedCustomer.phone : ''}
                          disabled
                        /> <br />
                        <div>
                          <label className="p-2 font-bold">Address</label> <br />

                          <textarea
                            className="w-48 lg:w-80 m-2 p-2 border border-gray-300 rounded-md text-black"
                            id="address"
                            name="address"
                            type="text"
                            value={selectedCustomer ? `${selectedCustomer.Address?.street}, ${selectedCustomer.Address?.city}` : ''}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="basis-[60%] max-w-[60%]">
                        <div className="flex items-center">
                          <div>
                            <div className="flex items-center pl-2">
                              <label className="font-bold">Vehicle</label>
                              <IconButton variant="text" onClick={() => selectedCustomer && setIsCustomerVehicleFormOpen(true)}>
                                <PlusCircleIcon className="h-5 w-5 text-blue-600 cursor-pointer" />
                              </IconButton>
                            </div>
                            <select
                              id="vehicle"
                              name="vehicle"
                              className="w-48 lg:w-72 m-2 p-2 border border-gray-300 bg-inherit rounded-md"
                              value={values.vehicle}
                              onChange={(e) =>
                                handleVehicleChange(e.target.value)
                              }
                              onBlur={handleBlur}
                            >

                              {selectedCustomer && selectedCustomer.Vehicle?.length > 0 ? selectedCustomer.Vehicle?.map((vehicle) => (
                                <option
                                  key={vehicle.id}
                                  value={vehicle.id}
                                >
                                  {vehicle.make} {vehicle.model} {vehicle.year}
                                </option>
                              ))
                                :
                                <option value="">Select Vehicle</option>
                              }
                            </select>
                            {touched.vehicle && errors.vehicle ? (
                              <div className="text-red-500">
                                {errors.vehicle}
                              </div>
                            ) : (<div></div>)} <br />
                          </div>
                          <div className="ml-3">
                            <label className="p-2 font-bold">Comments</label> <br />
                            <textarea
                              className="w-48 lg:w-80 m-2 p-2 border border-gray-300 rounded-md text-black"
                              id="comments"
                              name="comments"
                              type="text"
                              value={values.comments}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <div className="flex gap-5">
                          <div className="flex flex-col">
                            <div>
                              <label className="p-2 font-bold">Make</label> <br />
                              <input
                                className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                                id="make"
                                name="make"
                                type="text"
                                value={selectedVehicle ? selectedVehicle.make : ''}
                                disabled
                              /> <br />
                            </div>

                            <div>
                              <label className="p-2 font-bold">Model</label> <br />
                              <input
                                className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                                id="model"
                                name="model"
                                type="text"
                                value={selectedVehicle ? selectedVehicle.model : ''}
                                disabled
                              /> <br />
                            </div>
                          </div>
                          <div className="flex flex-col" >
                            <div>
                              <label className="p-2 font-bold">Year</label> <br />
                              <input
                                className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                                id="year"
                                name="year"
                                type="number"
                                value={selectedVehicle ? selectedVehicle.year : ''}
                                disabled
                              /> <br />
                            </div>

                            <div>
                              <label className="p-2 font-bold">Color</label> <br />
                              <input
                                className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                                id="color"
                                name="color"
                                type="text"
                                value={selectedVehicle ? selectedVehicle.color : ''}
                                disabled
                              /> <br />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-5">
                          <div className="flex flex-col" >
                            <div>
                              <div className="flex items-center pl-2">
                                <label className="font-bold">Odometer</label> <br />
                                <IconButton variant='text' onClick={() => setVehicleOdometer(selectedVehicle?.odometer)}>
                                  <ArrowUturnLeftIcon className="h-5 w-5 text-blue-600 cursor-pointer" />
                                </IconButton>
                              </div>
                              <input
                                className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                                id="year"
                                name="year"
                                type="number"
                                value={vehicleOdometer}
                                onChange={(e) => setVehicleOdometer(e.target.value)}
                              /> <br />
                            </div>

                            <div>
                              <label className="p-2 font-bold">License No.</label> <br />
                              <input
                                className="w-48 lg:w-72 m-2 p-2 border border-gray-300 rounded-md text-black"
                                id="color"
                                name="color"
                                type="text"
                                value={selectedVehicle ? selectedVehicle.licenseNo : ''}
                                disabled
                              /> <br />
                            </div>
                          </div>
                          <div className="flex flex-col ml-3 place-self-end">
                            <div className="text-5xl mt-5">
                              <h1>$  {calculateTotalAmountWithTax()}</h1>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    <Card className=" w-full">
                      <CardBody className="p-2">
                        <table className="w-full min-w-max table-auto text-left ">
                          <thead>
                            <tr>
                              {TABLE_HEAD.map((head) => (
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
                            {selectedProducts.map((item, index) => (
                              <tr key={index}>
                                <td className="p-4 border-b border-blue-gray-50">
                                  {index !== (selectedProducts.length - 1) ?
                                    <div className="w-[70%] h-[97%] m-2 p-2 border border-gray-300 rounded-md text-gray-600 font-small">
                                      {item.name}
                                    </div>
                                    :
                                    <div ref={productInputRef}>
                                      <input
                                        className="w-[70%] h-[97%] mx-2 p-2 border border-gray-300 rounded-md text-gray-600 font-small"
                                        id="product"
                                        name="product"
                                        type="text"
                                        value={selectedProducts[index].name ? selectedProducts[index].name : productSearchText}
                                        onClick={() => { selectedCustomer && setShowProductSuggestions(true) }}
                                        onChange={(e) => setProductSearchText(e.target.value)}
                                        onBlur={handleBlur}
                                        autoComplete="off"
                                        placeholder="Select Product"
                                      />
                                      {showProductSuggestions && (
                                        <ul className="d-block absolute z-50 bg-white border border-slate-700 w-[27%] mt-1 ml-2 overflow-y-auto min-h-24 max-h-48">
                                          {products?.length > 0 ?
                                            products.filter(product => `${product.name}`.toLowerCase().includes(productSearchText)).map((product) => (
                                              <li key={product.id} className="cursor-pointer px-2 py-1 rounded-sm hover:bg-gray-200" onClick={() => { handleProductChange(index, item.quantity, product.id), setShowProductSuggestions(false) }}>
                                                {product?.name}
                                              </li>
                                            ))
                                            :
                                            <li className="px-2 py-1 rounded-sm">No Product</li>
                                          }
                                        </ul>
                                      )}
                                    </div>
                                  }
                                </td>
                                <td className="p-4 border-b border-blue-gray-50">
                                  <input
                                    type="number"
                                    min={1}
                                    className="w-14 p-2 border rounded-md text-black"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(index, e.target.value)
                                    }
                                  />
                                </td>
                                <td className="p-4 border-b border-blue-gray-50">
                                  <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-normal opacity-70"
                                  >
                                    {item.price}
                                  </Typography>
                                </td>
                                <td className="p-4 border-b border-blue-gray-50">
                                  <input
                                    type="checkbox"
                                    checked={selectedCustomer?.taxable && item.taxable}
                                    readOnly
                                  />
                                </td>
                                <td className="p-4 border-b border-blue-gray-50">
                                  <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-normal opacity-70"
                                  >

                                    {calculateAmount(item.price, item.quantity)}
                                  </Typography>
                                </td>
                                <td className="p-4 border-b border-blue-gray-50 text-center px-4 py-2">
                                  {index !== selectedProducts.length - 1 ?
                                    <XCircleIcon
                                      onClick={() => handleRemoveProduct(index)}
                                      className="h-6 w-6 text-gray-600 hover:text-red-500 cursor-pointer"
                                    />
                                    :
                                    null
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>

                        </table>
                      </CardBody>
                    </Card>

                    <div className="flex">
                      <div className="basis-[50%] max-w-[50%]">
                      </div>

                      <div className="basis-[50%] max-w-[50%] border my-4 font-normal">
                        <div className="flex justify-between p-2">
                          <div className="text-1xl">
                            <h1>Subtotal</h1>
                          </div>
                          <div className="text-1xl">
                            <h1>{totalAmount} $</h1>
                          </div>
                        </div>

                        <div className="flex flex-col divide-y border-y">
                          {Object.keys(appliedTaxes).map((tax, ind) => (
                            <div key={ind} className="flex justify-between">
                              <span className="rounded w-min p-2 whitespace-nowrap basis-[50%]" >{`${tax.split('_')[0]} (${tax.split('_')[1]}${tax.split('_')[2]})`}</span>
                              <span className="text-1xl p-2 w-fit text-right basis-[50%]">{tax.split('_')[2] === '%' ? appliedTaxes[tax].toFixed(2) : appliedTaxes[tax]} $</span>
                            </div>
                          ))}
                        </div>

                        {/* <div className="flex justify-between mx-10">
                        <div className="w-min" >
                          <select
                            className="w-min p-2 border border-gray-300 bg-inherit rounded-md outline-none"
                            value={""}
                            onChange={(e) =>
                              handleTaxChange(e.target.value)
                            }
                          >
                            <option value="">Select Tax</option>
                            {taxes.map((tax) => (
                              <option
                                key={tax.id}
                                value={tax.id}
                              >
                                {tax.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div></div>                        
                      </div> */}

                        <div className="flex items-center justify-between p-2 font-medium text-black bg-yellow-700">
                          <div className="text-1xl">
                            <h1>Total</h1>
                          </div>
                          <div className="text-1xl">
                            <h1>{calculateTotalAmountWithTax()} $</h1>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!state?.workorder?.isViewOpen ? (
                  <div className="flex items-center justify-end space-x-2 sticky bg-gradient-to-br from-gray-800 to-gray-700">
                    {/* <ReactToPrint
                    ref={printRef}
                    trigger={() => <button
                      onClick={() => setSelectedQuotation(selectedQuotation)}
                      className={`w-32 bg-gray-600 hover:bg-gray-900 text-white font-bold py-2 px-4 ${!edit ? 'hidden' : ''}`}
                      type="button"
                    >
                      Print
                    </button>}
                    content={() => componentRef.current}
                  /> */}

                    {edit && (
                      <button className=" w-32 bg-gray-600 hover:bg-gray-900 text-white font-bold py-2 px-4"
                        onClick={() => { setEdit(false); dispatch({ type: 'SET_WORKORDER_VIEW', payload: true }); }}
                        type="button"
                      >
                        Back
                      </button>
                    )}

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
                        <span>{edit ? 'Update' : 'Save'}</span> :
                        <div className="flex items-center justify-center h-fit">
                          <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      }
                    </button>
                  </div>
                ) :
                  <div className="flex items-center justify-end space-x-2 sticky bg-gradient-to-br from-gray-800 to-gray-700"></div>
                }
              </div>
            </div>

          </form>
        )}
      </Dialog>
      <CustomerForm open={isCustomerFormOpen} close={closeCustomerForm} refresh={refresh} setRefresh={setRefresh} setSelectedCustomer={setSelectedCustomer} />
      {selectedCustomer ? <CustomerVehicleForm open={isCustomerVehicleFormOpen} close={closeCustomerVehicleForm} refresh={refresh} setRefresh={setRefresh} CustomerId={selectedCustomer?.id} getCustomerDetails={getCustomerDetails} /> : null}
      {printWorkOrder && Object.keys(printWorkOrder).length > 0 ? <PrintView view={false} workOrderData={printWorkOrder} ref={componentRef} appliedTaxes={appliedTaxes} /> : null}
    </>
  );
};

export default MyPopUpForm;