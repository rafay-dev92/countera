import React from "react";
import { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Card,
  Typography,
  CardBody,
  IconButton,
  Button,
  Checkbox,
  Tooltip,
} from "@material-tailwind/react";
import { Dialog, Input } from "@/widgets/mt";
import {
  XCircleIcon
} from "@heroicons/react/24/outline";
import { fetchProducts } from "@/services/fetchProducts";
import { fetchCustomers } from "@/services/fetchCustomers";
import { fetchTaxes } from "@/services/fetchTaxes";
import { addInvoice } from "@/services/addInvoice";
import { updateInvoice } from "@/services/updateInvoice";
import PrintView from "./printView";
import ReactToPrint, { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import CustomerVehicleForm from "../customer/customerVehicleForm";
import { fetchCustomer } from "@/services/fetchCustomer";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
// import CustomerForm from "./customerForm";
import CustomerForm from "@/utils/forms/customerForm";
import { updateCustomerVehicle } from "@/services/updateCustomerVehicle";
import ViewInvoice from "./viewInvoice";
import { fetchPackages } from "@/services/fetchPackages";
import ProductForm from "../../utils/forms/productForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { updateInvoiceShadow } from "@/services/updateInvoiceShadow";
import { useConfirm } from "@/context/confirmContext";
import { PaymentStatus } from "@countera/shared";
import type { Customer, ProductCategory, Tax } from "@/types/api";

/**
 * Row shape used by the products table: a merge of Product fields with the
 * per-line quantity/price/description the user edits. The REST payload uses
 * the lowercase `invoice_product` / `Tax` aliases (src/types/api.ts declares
 * them as `Invoice_Product` / `Taxes`), so rows are typed locally.
 */
interface SelectedProductRow {
  id?: string;
  product: string;
  name?: string;
  description: string | null;
  quantity: number;
  price: number;
  taxable: boolean;
  Tax?: Tax[];
  Category?: ProductCategory | null;
  replacement_reminder_date: Date | null;
}

/** Per product+tax entry kept in the invoiceTaxes map. */
interface InvoiceTaxEntry {
  TaxId: string;
  ProductId?: string;
  tax_name: string;
  tax_rate: number;
  tax_type: string;
  /** number while editing; mutated to a "x.xx" string before persisting */
  tax_amount: any;
}

/** Aggregated tax rows displayed in the totals panel. */
interface AppliedTaxEntry {
  tax_name: string | null;
  tax_rate: number;
  tax_type: string;
  tax_amount: number;
}

interface InvoiceFormValues {
  customer: string;
  vehicle: string;
  comments: string;
  manufactureWarranty: boolean;
  roadHazardWarranty: boolean;
  flatRepairWarranty: boolean;
  rotationWarranty: boolean;
  noWarranty: boolean;
  balanceWarranty: boolean;
}

interface MyPopUpFormProps {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
  /** Passed by table.tsx; visibility is actually driven by app state. */
  open?: boolean;
}

const TABLE_HEAD = [
  "Product",
  "Quantity",
  "Price",
  "Tax",
  "Amount",
  "Reminder Date",
  "Action"
]

const schema = Yup.object().shape({
  customer: Yup.string().required("Customer is required"),
  vehicle: Yup.string().required("Vehicle is required"),
  comments: Yup.string(),
  manufactureWarranty: Yup.boolean().default(false),
  roadHazardWarranty: Yup.boolean().default(false),
  flatRepairWarranty: Yup.boolean().default(false),
  rotationWarranty: Yup.boolean().default(false),
  noWarranty: Yup.boolean().default(false),
  balanceWarranty: Yup.boolean().default(false),
});

const MyPopUpForm = ({ refresh, setRefresh, close }: MyPopUpFormProps) => {
  const componentRef = useRef<HTMLDivElement | null>(null);
  const confirm = useConfirm();

  const printRef = useRef<any>(null);
  const customerInputRef = useRef<HTMLDivElement | null>(null);
  const productInputRef = useRef<HTMLDivElement | null>(null);

  const { state, dispatch } = State();
  const [resetForm, setResetForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productsPackages, setProductsPackages] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductRow[]>([{
    product: "",
    description: "",
    quantity: 1,
    price: 0,
    taxable: false,
    replacement_reminder_date: null
  }]);
  const [totalAmount, setTotalAmount] = useState<number | string>(0);
  const [discount, setDiscount] = useState(0);
  const [lumSum, setLumSum] = useState(0);
  const [isLumSumApplied, setIsLumSumApplied] = useState(false);
  const [labour, setLabour] = useState(0);
  const [labourBaseline, setLabourBaseline] = useState<{
    labourValue: number;
    productPrices: Record<number, { price: number; quantity: number }> | null;
  } | null>(null);
  const [edit, setEdit] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<any>({});
  const [appliedTaxes, setAppliedTaxes] = useState<Record<string, AppliedTaxEntry>>({});
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [vehicleOdometer, setVehicleOdometer] = useState<string | number>('');

  // invoice taxes
  const [invoiceTaxes, setInvoiceTaxes] = useState<Record<string, InvoiceTaxEntry>>({});

  // customer vehicle form
  const [isCustomerVehicleFormOpen, setIsCustomerVehicleFormOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);

  // product suggestions
  const [productSearchText, setProductSearchText] = useState("");
  const [productsPosition, setProductsPosition] = useState({ top: 0, left: 0, width: 0 })

  // product packages
  const [selectedPackage, setSelectedPackage] = useState("");
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packagePreview, setPackagePreview] = useState<any>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  const closeCustomerVehicleForm = () => {
    setIsCustomerVehicleFormOpen(false);
  };

  const closeCustomerForm = () => {
    setIsCustomerFormOpen(false);
  };

  const showToastMessage = (type: string, message: string) => {
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
    setDiscount(0);
    setLabour(0);
    setProductSearchText("");
    setSelectedCustomer(null)
    setSelectedVehicle(null)
    dispatch({ type: 'SET_INVOICE_VIEW_DATA', payload: null });
    setSelectedProducts([{
      product: "",
      description: "",
      quantity: 1,
      price: 0,
      taxable: false,
      replacement_reminder_date: null
    }]);
    setAppliedTaxes({});
    setInvoiceTaxes({});
    clearForm(formikProps);
    setEdit(false);
    setRefresh(!refresh);
    dispatch({ type: 'SET_INVOICE_VIEW', payload: false });
    setPrintInvoice({});
    setLabourBaseline(null);
    close();
  };

  // get customer details
  const getCustomerDetails = async () => {
    try {
      const customer = await (await fetchCustomer(selectedCustomer?.id as string, state.userToken))!.json();
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
    if (state?.invoice?.viewData) {
      const selectedInvoice = state.invoice.viewData;
      setPrintInvoice(selectedInvoice);
      setDiscount(selectedInvoice.discount || 0)
      setSelectedCustomer(selectedInvoice.Customer)
      setSelectedVehicle(selectedInvoice.CustomerVehicle)
      setVehicleOdometer(selectedInvoice.CustomerVehicle?.odometer)
      
      setValues({ ...selectedInvoice, ['customer']: selectedInvoice.CustomerId, ['vehicle']: selectedInvoice.CustomerVehicleId } as any)
      let selectedProd = [...selectedProducts]
      selectedInvoice?.Products?.forEach((prod: any) => {
        const aProd = {
          product: prod.id,
          id: prod.id,
          name: prod.name,
          price: prod.invoice_product.price,
          quantity: prod.invoice_product.quantity,
          taxable: prod.taxable,
          Tax: prod.Tax,
          Category: prod.Category,
          description: prod.invoice_product.description,
          replacement_reminder_date: prod.invoice_product.replacement_reminder_date ? new Date(prod.invoice_product.replacement_reminder_date) : null
        }
        selectedProd = [aProd, ...selectedProd];
      })

      const productTaxes: Record<string, number> = {};

      selectedProd.forEach((product) => {
        product.Tax?.forEach((productTax) => {
          const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

          if (productTax.name === 'Sales Tax' && !state?.invoice?.viewData?.Customer?.taxable) {
            return; // Skip Sales Tax calculation for non-taxable customers
          }

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
      // setAppliedTaxes(selectedInvoice.appliedTaxes);
      // NOTE: the API payload carries `appliedTaxes` on invoices even though
      // the Invoice type in src/types/api.ts does not declare it.
      setAppliedTaxes(Object.values((selectedInvoice as any).appliedTaxes as Record<string, InvoiceTaxEntry>).reduce<Record<string, AppliedTaxEntry>>((acc, tax) => {
        const key = `${tax.TaxId}_${tax.tax_rate}_${tax.tax_type}`;

        if (!acc[key]) {
          acc[key] = {
            tax_name: tax.tax_name,
            tax_rate: tax.tax_rate,
            tax_type: tax.tax_type,
            tax_amount: 0,
          };
        }

        acc[key].tax_amount = Number(
          (acc[key].tax_amount + Number(tax.tax_amount)).toFixed(2)
        );

        return acc;
      }, {}));
      setInvoiceTaxes((selectedInvoice as any).appliedTaxes);
      setSelectedProducts(selectedProd);
      
      // Calculate labour from products
      const calculatedLabour = calculateLabour(selectedProd.filter(p => p.id));
      setLabour(calculatedLabour > 0 ? calculatedLabour : selectedInvoice.labour);
    }
  }, [state?.invoice?.viewData, resetForm]);

  // handle submit
  const onSubmit = async (values: InvoiceFormValues) => {
    setIsLoading(true);

    const selectedProductIds = selectedProducts.map((product) => ({
      id: product.id,
      quantity: product.quantity,
      description: product.description || '',
      price: product.price,
      replacement_reminder_date: product.replacement_reminder_date
    })).filter(product => product.id); // Remove empty products

    if (selectedVehicle?.odometer < vehicleOdometer) {
      try {
        const customerVehicleUpdate = (await updateCustomerVehicle(selectedVehicle.id, { odometer: vehicleOdometer } as any, state.userToken))!;
        if (customerVehicleUpdate.status === 200) {
          showToastMessage('success', 'Vehicle odometer updated successfully');
        }
      } catch (error) {
        console.log(error)
        showToastMessage('error', 'Vehicle odometer update failed');
      }
    }

    const data = {
      invoiceData: {
        ...values,
        totalAmount: calculateTotalAmountWithTax(),
        discount: discount,
        labour: labour,
        CustomerId: selectedCustomer!.id,
        CustomerVehicleId: selectedVehicle.id,
        comments: values.comments,
        BusinessId: state.business!.id
      },
      products: selectedProductIds,
      taxes: Object.values(invoiceTaxes).map(invoiceTax => invoiceTax)
    };

    try {
      if (edit) {
        const confirmed = await confirm("Are you sure you want to update this invoice?");
        if (!confirmed) {
          setIsLoading(false);
          return;
        }

        if (printInvoice.paymentStatus !== "PAID") {
          const res = (await updateInvoice(printInvoice.id, data, state.userToken))!
          const invoice = await res.json();
          setPrintInvoice(invoice?.data);
          if (res.status === 200) {
            showToastMessage('success', invoice.message)
          }
          else if (res.status === 404) {
            showToastMessage('info', invoice.message)
          }
          else if (res.status === 409) {
            showToastMessage('error', invoice.message)
          }
        }
        else {
          const res = (await updateInvoiceShadow(printInvoice.id, data, state.userToken))!
          const invoice = await res.json();
          setPrintInvoice(invoice?.data);
          if (res.status === 200) {
            showToastMessage('success', invoice.message)
          }
          else if (res.status === 404) {
            showToastMessage('info', invoice.message)
          }
          else if (res.status === 409) {
            showToastMessage('error', invoice.message)
          }
        }
      }
      else {
        const res = (await addInvoice(data, state.userToken))!
        const invoice = await res.json();
        setPrintInvoice(invoice?.data);
        if (res.status === 200) {
          showToastMessage('success', invoice.message)
        }
        else if (res.status === 409) {
          showToastMessage('error', invoice.message)
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
      const fetchedProducts = (await fetchProducts(state.userToken))!;
      const productsData: any[] = await fetchedProducts.json();
      setProducts(productsData);
    } catch (error: any) {
      console.log(error.message);
      showToastMessage('error', 'Something went wrong');
    }
  };

  // get products packages
  const getProductsPackages = async () => {
    try {
      const fetchedPackages = (await fetchPackages(state.userToken))!;
      const packagesData = await fetchedPackages.json();
      setProductsPackages(packagesData.data);
    } catch (error: any) {
      console.log(error.message);
      showToastMessage('error', 'Something went wrong');
    }
  };

  const handlePackageChange = (packageId: string) => {
    if (packageId) {
      const selected = productsPackages.find((pkg) => pkg.id === packageId);
      if (selected) {
        setPackagePreview(selected);
        setModalQuantity(1);
        setShowPackageModal(true);
      }
    }
  };

// Helper to identify labour products
const isLabourProduct = (product: any) => {
  const categoryName = product?.Category?.name;
  if (!categoryName || typeof categoryName !== "string") {
    return false;
  }
  const normalized = categoryName.toLowerCase();
  return normalized === "labor" || normalized === "labour";
};

// Calculate labour from selected products
const calculateLabour = (products: SelectedProductRow[]) => {
  let totalLabour = 0;
  products.forEach((product) => {
    if (isLabourProduct(product)) {
      const productPrice = parseFloat(product.price as any) || 0;
      const productQuantity = parseFloat(product.quantity as any) || 0;
      totalLabour += productPrice * productQuantity;
    }
  });
  return totalLabour;
};

// Distribute additional labour amount across labour products
const distributeExcessToLabourProducts = (excessAmount: number) => {
  if (excessAmount <= 0) return;

  setSelectedProducts((prevProducts) => {
    const labourIndexes: number[] = [];
    prevProducts.forEach((product, index) => {
      if (isLabourProduct(product) && product.id) {
        labourIndexes.push(index);
      }
    });

    const baselineLabourValue = calculateLabour(
      prevProducts.filter((product) => product.id)
    ) || state.invoice.viewData?.labour || 0;

    setLabourBaseline((prevBaseline) => {
      if (prevBaseline) {
        return prevBaseline;
      }

      if (labourIndexes.length === 0) {
        return {
          labourValue: baselineLabourValue,
          productPrices: null,
        };
      }

      const productPrices: Record<number, { price: number; quantity: number }> = {};
      labourIndexes.forEach((index) => {
        const product = prevProducts[index];
        if (product) {
          productPrices[index] = {
            price: parseFloat(product.price as any) || 0,
            quantity: parseFloat(product.quantity as any) || 0,
          };
        }
      });

      return {
        labourValue: baselineLabourValue,
        productPrices,
      };
    });

    if (labourIndexes.length === 0) {
      setLabour((prevLabour) => parseFloat(prevLabour as any) + excessAmount);
      return prevProducts;
    }

    const labourIndexSet = new Set(labourIndexes);
    const labourMeta = labourIndexes.map((index) => {
      const product = prevProducts[index];
      const price = parseFloat(product.price as any) || 0;
      const quantity = parseFloat(product.quantity as any) || 0;
      const safeQuantity = quantity > 0 ? quantity : 1;
      const currentTotal = price * safeQuantity;
      return {
        index,
        safeQuantity,
        currentTotal,
      };
    });

    const totalCurrentLabour = labourMeta.reduce(
      (sum, item) => sum + item.currentTotal,
      0
    );
    const equalShare =
      labourIndexes.length > 0 ? excessAmount / labourIndexes.length : 0;

    const labourMetaMap = new Map(
      labourMeta.map((item) => [item.index, item])
    );

    const updatedProducts = prevProducts.map((product, index) => {
      if (!labourIndexSet.has(index)) {
        return product;
      }

      const meta = labourMetaMap.get(index);
      if (!meta) {
        return product;
      }

      const safeQuantity = meta.safeQuantity;
      const currentTotal = meta.currentTotal;
      const allocatedAmount =
        totalCurrentLabour > 0
          ? (currentTotal / totalCurrentLabour) * excessAmount
          : equalShare;
      const newTotal = currentTotal + allocatedAmount;
      const newPrice = Number((newTotal / safeQuantity).toFixed(2));

      return {
        ...product,
        price: newPrice,
      };
    });

    const recalculatedLabour = calculateLabour(
      updatedProducts.filter((product) => product.id)
    );
    setLabour(recalculatedLabour);
    recalculateTaxes(updatedProducts);
    return updatedProducts;
  });
};

  // calculate changable amount
  const getCashAmount = (invoice: any) => {
    const cashAmount = invoice.Payments.reduce((acc: number, payment: any) => payment.paymentMethod === 'Cash' ? acc + payment.paidAmount : acc, 0);
    return cashAmount.toFixed(2);
  };

  // Handle product change
  const handleProductChange = async (index: number, quantity: number, selectedProId: string) => {
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
        quantity,
        price: selectedProductDetails.price,
        taxable: selectedProductDetails.taxable,
        Tax: selectedProductDetails.Tax,
        Category: selectedProductDetails.Category,
        description: "",
        replacement_reminder_date: null
      };
    } else {
      // Reset the row if no product is found
      updatedItems[index] = {
        id: "",
        product: "",
        description: "",
        name: "",
        quantity: 1,
        price: 0,
        taxable: false,
        Tax: [],
        replacement_reminder_date: null
      };
    }

    // Recalculate taxes
    recalculateTaxes(updatedItems);

    // Recalculate labour
    const calculatedLabour = calculateLabour(updatedItems.filter(p => p.id));
    setLabour(calculatedLabour);

    // Add a new empty row if it's the last row and a product is selected
    const isLastRow = index === selectedProducts.length - 1;
    if (isLastRow && selectedProId) {
      updatedItems.push({
        id: "",
        product: "",
        description: "",
        name: "",
        quantity: 1,
        price: 0,
        taxable: false,
        Tax: [],
        replacement_reminder_date: null
      });
    }

    setSelectedProducts(updatedItems);
    setProductSearchText("");
  };

  const isQuantityUpdateAccepted = (updatedItems: SelectedProductRow[]) => {
    const cashAmount = getCashAmount(printInvoice);
    const totalCurrentAmount = updatedItems.reduce((acc, item) => {
      return acc + (parseFloat(item.price as any) || 0) * (parseFloat(item.quantity as any) || 0);
    }, 0);
    const taxes = recalculateTaxes(updatedItems);
    const totalTaxAmount = Object.values(taxes).reduce((acc, tax) => acc + parseFloat(tax as any), 0);
    const paymentDifference = printInvoice.paidAmount - (totalCurrentAmount + totalTaxAmount);
    return paymentDifference <= parseFloat(cashAmount);
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, quantity: any) => {
    const updatedItems = [...selectedProducts];
    updatedItems[index].quantity = Number(quantity);

    if (printInvoice.paymentStatus === "PAID") {
      const isAccepted = isQuantityUpdateAccepted(updatedItems);
      if (!isAccepted) {
        updatedItems[index].quantity = Number(quantity) + 1;
        toast.error("update amount must be less than or equal to invoice amount");
        return;
      }
    }

    // Recalculate taxes
    recalculateTaxes(updatedItems);

    // Recalculate labour
    const calculatedLabour = calculateLabour(updatedItems.filter(p => p.id));
    setLabour(calculatedLabour);

    setSelectedProducts(updatedItems);
  };

  const isPriceUpdateAccepted = (updatedItems: SelectedProductRow[]) => {
    const cashAmount = getCashAmount(printInvoice);
    const totalCurrentAmount = updatedItems.reduce((acc, item) => {
      return acc + (parseFloat(item.price as any) || 0) * (parseFloat(item.quantity as any) || 0);
    }, 0);
    const taxes = recalculateTaxes(updatedItems);
    const totalTaxAmount = Object.values(taxes).reduce((acc, tax) => acc + parseFloat(tax as any), 0);
    const paymentDifference = printInvoice.paidAmount - (totalCurrentAmount + totalTaxAmount);
    return paymentDifference <= parseFloat(cashAmount);
  };

  // Handle price change
  const handlePriceChange = (index: number, price: any) => {
    const updatedItems = [...selectedProducts];
    updatedItems[index].price = Number(price);

    if (printInvoice.paymentStatus === PaymentStatus.PAID) {
      // Check if the updated price exceeds the cash amount
      const isAccepted = isPriceUpdateAccepted(updatedItems);
      if (!isAccepted) {
        updatedItems[index].price = Number(price) + 1;
        toast.error("update amount must be less than or equal to cash amount");
        return;
      }
    }

    // Recalculate taxes
    recalculateTaxes(updatedItems);
    
    // Recalculate labour
    const calculatedLabour = calculateLabour(updatedItems.filter(p => p.id));
    setLabour(calculatedLabour);

    setSelectedProducts(updatedItems);
  };

  const isProductRemovedAccepted = (updatedItems: SelectedProductRow[]) => {
    const cashAmount = getCashAmount(printInvoice);
    const totalCurrentAmount = updatedItems.reduce((acc, item) => {
      return acc + (parseFloat(item.price as any) || 0) * (parseFloat(item.quantity as any) || 0);
    }, 0);
    const taxes = recalculateTaxes(updatedItems);
    const totalTaxAmount = Object.values(taxes).reduce((acc, tax) => acc + parseFloat(tax as any), 0);
    const paymentDifference = printInvoice.paidAmount - (totalCurrentAmount + totalTaxAmount);
    return paymentDifference <= parseFloat(cashAmount);
  };

  // Handle removing a product
  const handleRemoveProduct = (index: number) => {
    const updatedItems = [...selectedProducts];
    const removedProduct = updatedItems[index];

    updatedItems.splice(index, 1);

    if (printInvoice.paymentStatus === PaymentStatus.PAID) {
      const isAccepted = isProductRemovedAccepted(updatedItems);
      if (!isAccepted) {
        toast.error("update amount must be less than or equal to cash amount");
        return;
      }
    }

    // Recalculate taxes if there are remaining items
    let updatedInvoiceTaxes: Record<string, InvoiceTaxEntry> = { ...invoiceTaxes };
    if (removedProduct) {
      removedProduct.Tax?.forEach((productTax) => {
        delete updatedInvoiceTaxes[`${removedProduct.id}_${productTax.id}`];
      });
    }

    // Recalculate taxes with updated quoteTaxes
    if (updatedItems.length > 0) {
      recalculateTaxesWithUpdatedState(updatedItems, updatedInvoiceTaxes);
    } else {
      setInvoiceTaxes({});
      setAppliedTaxes({});
    }

    // Recalculate labour
    const calculatedLabour = calculateLabour(updatedItems.filter(p => p.id));
    setLabour(calculatedLabour);

    setSelectedProducts(updatedItems);
  };


    // Recalculate taxes with updated state
    const recalculateTaxesWithUpdatedState = (products: SelectedProductRow[], updatedInvoiceTaxes: Record<string, InvoiceTaxEntry>) => {
      const tempInvoiceTaxes = updatedInvoiceTaxes || {};
  
      products.forEach((product) => {
        product.Tax?.forEach((productTax) => {
  
          if (productTax.name === 'Sales Tax' && !selectedCustomer?.taxable) {
            return; // Skip Sales Tax calculation for non-taxable customers
          }
  
          const key2 = `${product.id}_${productTax.id}`;
          if (!tempInvoiceTaxes[key2]) {
            tempInvoiceTaxes[key2] = {
              TaxId: productTax.id,
              ProductId: product.id,
              tax_name: productTax.name,
              tax_rate: productTax.rate,
              tax_type: productTax.type,
              tax_amount: 0,
            };
          }

          if (productTax.type === "%") {
            tempInvoiceTaxes[key2].tax_amount = (product.price * product.quantity * (tempInvoiceTaxes[key2].tax_rate / 100));
          } else {
            tempInvoiceTaxes[key2].tax_amount = (product.quantity * tempInvoiceTaxes[key2].tax_rate);
          }
        });
      });

      setAppliedTaxes(Object.values(tempInvoiceTaxes).reduce<Record<string, AppliedTaxEntry>>((acc, tax) => {
        const key = `${tax.TaxId}_${tax.tax_rate}_${tax.tax_type}`;
  
        if (!acc[key]) {
          acc[key] = {
            tax_name: tax.tax_name,
            tax_rate: tax.tax_rate,
            tax_type: tax.tax_type,
            tax_amount: 0,
          };
        }
  
        acc[key].tax_amount = Number(
          (acc[key].tax_amount + Number(tax.tax_amount)).toFixed(2)
        );
  
        return acc;
      }, {}));
  
      Object.values(tempInvoiceTaxes).forEach((tax) => {
        tax.tax_amount = (Number(tax.tax_amount)).toFixed(2);
      });
      setInvoiceTaxes(tempInvoiceTaxes);
    };
  

  // Recalculate taxes
  const recalculateTaxes = (products: SelectedProductRow[]) => {
    const productTaxes: Record<string, number> = {};
    const tempInvoiceTaxes = invoiceTaxes || {};
    products.forEach((product) => {
      product.Tax?.forEach((productTax) => {
        // const key = `${productTax.name}_${productTax.rate}_${productTax.type}`;

        if (productTax.name === 'Sales Tax' && !selectedCustomer?.taxable) {
          return; // Skip Sales Tax calculation for non-taxable customers
        }

        // if (!productTaxes[key]) {
        //   productTaxes[key] = 0;
        // }

        const key2 = `${product.id}_${productTax.id}`;
        if (!tempInvoiceTaxes[key2]) {
          tempInvoiceTaxes[key2] = {
            TaxId: productTax.id,
            ProductId: product.id,
            tax_name: productTax.name,
            tax_rate: productTax.rate,
            tax_type: productTax.type,
            tax_amount: 0,
          };
        }

        if (productTax.type === "%") {
          // productTaxes[key] += product.price * product.quantity * (productTax.rate / 100);
          tempInvoiceTaxes[key2].tax_amount = (product.price * product.quantity * (invoiceTaxes[key2].tax_rate / 100));
        } else {
          // productTaxes[key] += product.quantity * productTax.rate;
          tempInvoiceTaxes[key2].tax_amount = (product.quantity * invoiceTaxes[key2].tax_rate);
        }
      });
    });

    setAppliedTaxes(Object.values(invoiceTaxes).reduce<Record<string, AppliedTaxEntry>>((acc, tax) => {
      const key = `${tax.TaxId}_${tax.tax_rate}_${tax.tax_type}`;

      if (!acc[key]) {
        acc[key] = {
          tax_name: tax.tax_name,
          tax_rate: tax.tax_rate,
          tax_type: tax.tax_type,
          tax_amount: 0,
        };
      }

      acc[key].tax_amount = Number(
        (acc[key].tax_amount + Number(tax.tax_amount)).toFixed(2)
      );

      return acc;
    }, {}));

    Object.values(tempInvoiceTaxes).forEach((tax) => {
      tax.tax_amount = (Number(tax.tax_amount)).toFixed(2);
    });
    setInvoiceTaxes(tempInvoiceTaxes);
    return productTaxes;
  };

  // calculate amount
  const calculateAmount = (price: any, quantity: any) => {
    const unitPrice = parseFloat(price) || 0;
    const qty = parseFloat(quantity) || 0;
    return (unitPrice * qty).toFixed(2);
  };

  // get customers
  const getCustomers = async () => {
    const fetchedCustomers = (await fetchCustomers(state.userToken))!;
    const customersData: Customer[] = await fetchedCustomers.json();
    setCustomers(customersData);
  };

  useEffect(() => {
    if (selectedCustomer) {
      getCustomerDetails();
    }
  }, [refresh]);

  // handle customer change
  const handleCustomerChange = (customer: Customer) => {
    setSelectedCustomer(customer);
    if (customer && customer.Vehicle!.length > 0) {
      setSelectedVehicle(customer.Vehicle![0]);
      setVehicleOdometer(customer.Vehicle![0]?.odometer);
      setValues({ ...values, ['customer']: `${customer.firstName} ${customer.lastName}`, ['vehicle']: customer.Vehicle![0].id })
    };
    setShowCustomerSuggestions(false);
  };

  // handle vehicle change
  const handleVehicleChange = (vehicleId: string) => {
    if (vehicleId === "") return;
    const foundVehicle = selectedCustomer!.Vehicle!.find(
      (vehicle) => `${vehicle.id}` === vehicleId
    );
    setSelectedVehicle(foundVehicle);
    setVehicleOdometer(foundVehicle!.odometer);
    setValues({ ...values, ['vehicle']: vehicleId })
  };

  // calculate total amount
  const calculateTotalAmount = () => {
    let total = 0;
    selectedProducts
      .filter((item) => !isLabourProduct(item))
      .forEach((item) => {
        total += parseFloat(calculateAmount(item.price, item.quantity));
      });
      return total.toFixed(2);
  };

  // calculate tax amount
  const calculateTotalTaxAmount = () => {
    let totalTaxAmount = 0;

    if (Object.values(invoiceTaxes).length > 0) {
      Object.keys(invoiceTaxes).forEach((tax) => {
        totalTaxAmount += parseFloat(invoiceTaxes[tax].tax_amount);
      });
      return totalTaxAmount;
    }
    return 0;
  };

  // calculate total amount with tax
  const calculateTotalAmountWithTax = () => {
    const amount = parseFloat(calculateTotalAmount()) || 0;
    const tax = parseFloat(calculateTotalTaxAmount() as any) || 0;
    const labourAmount = parseFloat(labour as any) || 0;
    return (amount + tax + labourAmount - parseFloat(discount as any)).toFixed(2);
  };

  useEffect(() => {
    const total = calculateTotalAmount();
    setTotalAmount(total);
  }, [selectedProducts]);

  // get taxes
  const getTaxes = async () => {
    try {
      const fetchedTaxes = (await fetchTaxes(state.userToken))!;
      const taxesData: Tax[] = await fetchedTaxes.json();
      setTaxes(taxesData);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong")
    }
  };

  // handle customer suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerInputRef.current && !customerInputRef.current.contains(event.target as Node)) {
        setShowCustomerSuggestions(false);
      }

      if (productInputRef.current && !productInputRef.current.contains(event.target as Node)) {
        setShowProductSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // fetch data
  useEffect(() => {
    getProducts();
    getProductsPackages();
    getCustomers();
    getTaxes();
  }, [refresh]);

  const clearForm = (formikProps: any) => {
    formikProps.resetForm({
      values: {
        customer: "",
        vehicle: "",
        comments: "",
        manufactureWarranty: false,
        roadHazardWarranty: false,
        flatRepairWarranty: false,
        rotationWarranty: false,
        noWarranty: false,
        balanceWarranty: false,
      },
      errors: {
        customer: "",
        vehicle: "",
        comments: "",
        manufactureWarranty: false,
        roadHazardWarranty: false,
        flatRepairWarranty: false,
        rotationWarranty: false,
        noWarranty: false,
        balanceWarranty: false,
      },
    });
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setVehicleOdometer('');
    setSelectedProducts([{
      product: "",
      description: "",
      quantity: 1,
      price: 0,
      taxable: false,
      replacement_reminder_date: null
    }])
    setAppliedTaxes({});
    setInvoiceTaxes({});
    setSelectedPackage("");
    setDiscount(0);
    setLabour(0);
    setLumSum(0);
    setIsLumSumApplied(false);
  setLabourBaseline(null);
  };

  const formikProps = useFormik<InvoiceFormValues>({
    initialValues: {
      customer: "",
      vehicle: "",
      comments: "",
      manufactureWarranty: false,
      roadHazardWarranty: false,
      flatRepairWarranty: false,
      rotationWarranty: false,
      noWarranty: false,
      balanceWarranty: false,
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

  const reactToPrintFn = useReactToPrint({ componentRef } as any);

  useEffect(() => {
    if (printInvoice && Object.keys(printInvoice).length > 0) {
      dispatch({ type: 'SET_INVOICE_VIEW', payload: true });
    }
  }, [printInvoice, dispatch])


  const handleLumSum = () => {
    const subtotal = parseFloat(calculateTotalAmount());
    const taxes = parseFloat(calculateTotalTaxAmount() as any);
    const currentLabour = parseFloat(labour as any) || 0;
    const currentTotal = subtotal + taxes + currentLabour;
    const lump = parseFloat(lumSum as any) || 0;

  if (lump > currentTotal) {
    const excessAmount = parseFloat((lump - currentTotal).toFixed(2));
    if (currentLabour > 0) {
      distributeExcessToLabourProducts(excessAmount);
    } else {
      // console.log({excessAmount: parseFloat(excessAmount)});
      setLabour(parseFloat(excessAmount as any));
    }
    setDiscount(0);
  } else if (lump < currentTotal) {
    const difference = parseFloat((currentTotal - lump).toFixed(2));
    const maxDiscount = currentTotal * 0.25;

    if (difference > maxDiscount) {
      toast.error("Discount cannot exceed 25% of total amount");
      return;
    }

    setDiscount(difference);
  } else {
    setDiscount(0);
  }

  setIsLumSumApplied(true);
  }

const handleResetLumSum = () => {
  const baselineSnapshot = labourBaseline;

  setLumSum(0);
  setIsLumSumApplied(false);
  setDiscount(0);

  setSelectedProducts((prevProducts) => {
    let updatedProducts = prevProducts;

    if (baselineSnapshot?.productPrices) {
      updatedProducts = prevProducts.map((product, index) => {
        const baseline = baselineSnapshot!.productPrices![index];
        if (!baseline) {
          return product;
        }

        return {
          ...product,
          price: baseline.price,
          quantity:
            baseline.quantity !== undefined ? baseline.quantity : product.quantity,
        };
      });
    } else {
      updatedProducts = [...prevProducts];
    }

    const recalculatedLabour = baselineSnapshot
      ? baselineSnapshot.labourValue
      : calculateLabour(updatedProducts.filter((product) => product.id));

    setLabour(recalculatedLabour);
    recalculateTaxes(updatedProducts);
    return updatedProducts;
  });

  setLabourBaseline(null);
};

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
      <Dialog className="bg-transparent shadow-none p-0" open={state?.invoice?.openForm} size="xl">
        {state?.invoice?.openForm && (
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center items-start lg:items-center min-h-screen lg:max-h-[90vh]">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                  <div className="text-[15px] font-semibold text-slate-900">
                    {state?.invoice?.isViewOpen ? "View invoice" : edit ? "Edit invoice" : "New invoice"}
                  </div>
                  <button
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
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

                {state?.invoice?.isViewOpen ? (
                  <ViewInvoice printInvoice={printInvoice} setPrintInvoice={setPrintInvoice} componentRef={componentRef} appliedTaxes={appliedTaxes} setEdit={setEdit} close={handleClose} />
                ) : (
                  <div className="overflow-y-auto h-[65vh] lg:h-[75vh] overflow-x-auto p-4 md:p-6 w-full">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="w-full lg:w-[35%]">
                        <div className="relative mb-7" ref={customerInputRef}>
                          <div className="flex items-center pl-2">
                            <label className="text-[13px] font-medium text-slate-700">Customer</label>
                            <IconButton variant="text" onClick={() => setIsCustomerFormOpen(true)}>
                              <PlusCircleIcon className="h-5 w-5 text-teal-700 cursor-pointer" />
                            </IconButton>
                          </div>
                          <div className="px-2 relative">
                            <input
                              className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                              id="customer"
                              name="customer"
                              type="text"
                              value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : values.customer}
                              onClick={() => { setShowCustomerSuggestions(true); setValues({ ...values, ['customer']: '' }) }}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSelectedCustomer(null); setSelectedVehicle(null); setVehicleOdometer(''), handleChange(e) }}
                              onBlur={handleBlur}
                              autoComplete="off"
                              placeholder="Select Customer"
                            />
                            {showCustomerSuggestions && (
                              <ul className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-md shadow-lg mt-1 overflow-y-auto min-h-24 max-h-48">
                                {customers.length > 0 ?
                                  customers
                                    .filter(customer => {
                                      const searchTerm = values.customer.trim().toLowerCase();
                                      return (
                                        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm) ||
                                        customer.phone?.toLowerCase().includes(searchTerm)
                                      );
                                    })
                                    .map(customer => (
                                      <li
                                        key={customer.id}
                                        className="cursor-pointer px-2 py-1 rounded-sm text-sm text-slate-700 hover:bg-slate-100"
                                        onClick={() => handleCustomerChange(customer)}
                                      >
                                        {customer.firstName} {customer.lastName}
                                      </li>
                                    ))
                                  :
                                  <li className="px-2 py-1 rounded-sm">No Customer</li>
                                }
                              </ul>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 px-2">
                          <div>
                            <label className="text-[13px] font-medium text-slate-700">Name</label>
                            <input
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                              id="email"
                              name="email"
                              type="email"
                              value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''}
                              disabled
                            />
                          </div>

                          <div>
                            <label className="text-[13px] font-medium text-slate-700">Email</label>
                            <input
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                              id="email"
                              name="email"
                              type="email"
                              value={(selectedCustomer ? selectedCustomer.email : '') as any}
                              disabled
                            />
                          </div>

                          <div>
                            <label className="text-[13px] font-medium text-slate-700">Phone</label>
                            <input
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                              id="phone"
                              name="phone"
                              type="text"
                              value={(selectedCustomer ? selectedCustomer.phone : '') as any}
                              disabled
                            />
                          </div>

                          <div>
                            <label className="text-[13px] font-medium text-slate-700">Address</label>
                            <textarea
                              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                              id="address"
                              name="address"
                              {...({ type: "text" } as any)}
                              value={selectedCustomer ? [
                                selectedCustomer?.Address?.street,
                                selectedCustomer?.Address?.city
                              ].filter(Boolean).join(', ') : ''}
                              disabled
                            />
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-[55%]">
                        <div className="">
                          <div className="flex flex-col lg:flex-row gap-4">
                            <div className="w-full lg:w-1/2">
                              <div className="flex items-center pl-2">
                                <label className="text-[13px] font-medium text-slate-700">Vehicle</label>
                                <IconButton variant="text" onClick={() => selectedCustomer && setIsCustomerVehicleFormOpen(true)}>
                                  <PlusCircleIcon className="h-5 w-5 text-teal-700 cursor-pointer" />
                                </IconButton>
                              </div>
                              <div className="px-2">
                                <select
                                  id="vehicle"
                                  name="vehicle"
                                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                  value={values.vehicle}
                                  onChange={(e) => handleVehicleChange(e.target.value)}
                                  onBlur={handleBlur}
                                >
                                  {selectedCustomer && (selectedCustomer.Vehicle?.length as any) > 0 ? selectedCustomer.Vehicle?.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                      {vehicle.make} {vehicle.model} {vehicle.year}
                                    </option>
                                  )) : <option value="">Select Vehicle</option>
                                  }
                                </select>
                              </div>
                            </div>

                            <div className="w-full lg:w-1/2">
                              <label className="text-[13px] font-medium text-slate-700 pl-2">Comments</label>
                              <div className="px-2">
                                <textarea
                                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                  id="comments"
                                  name="comments"
                                  {...({ type: "text" } as any)}
                                  value={values.comments}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div>
                                <label className="text-[13px] font-medium text-slate-700 pl-2">Make</label>
                                <div className="px-2">
                                  <input
                                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                    id="make"
                                    name="make"
                                    type="text"
                                    value={selectedVehicle ? selectedVehicle.make : ''}
                                    disabled
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[13px] font-medium text-slate-700 pl-2">Model</label>
                                <div className="px-2">
                                  <input
                                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                    id="model"
                                    name="model"
                                    type="text"
                                    value={selectedVehicle ? selectedVehicle.model : ''}
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-[13px] font-medium text-slate-700 pl-2">Year</label>
                                <div className="px-2">
                                  <input
                                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                    id="year"
                                    name="year"
                                    type="number"
                                    value={selectedVehicle ? selectedVehicle.year : ''}
                                    disabled
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[13px] font-medium text-slate-700 pl-2">Color</label>
                                <div className="px-2">
                                  <input
                                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                    id="color"
                                    name="color"
                                    type="text"
                                    value={(selectedVehicle ? selectedVehicle.color : '') as any}
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center pl-2">
                                  <label className="text-[13px] font-medium text-slate-700">Odometer</label>
                                  <Tooltip content="Reset" className="z-[9999]">
                                    <IconButton
                                      variant="text"
                                      onClick={() => setVehicleOdometer(selectedVehicle?.odometer)}
                                      disabled={String(vehicleOdometer) === String(selectedVehicle?.odometer)}
                                    >
                                      <ArrowUturnLeftIcon className="h-5 w-5 text-teal-700 cursor-pointer" />
                                    </IconButton>
                                  </Tooltip>
                                </div>
                                <div className="px-2">
                                  <input
                                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                    id="year"
                                    name="year"
                                    type="number"
                                    value={vehicleOdometer}
                                    onChange={(e) => setVehicleOdometer(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[13px] font-medium text-slate-700 pl-2">License No.</label>
                                <div className="px-2">
                                  <input
                                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                    id="color"
                                    name="color"
                                    type="text"
                                    value={selectedVehicle ? selectedVehicle.licenseNo : ''}
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-12 mt-3">
                              <div>
                                <label className="text-[13px] font-medium text-slate-700 pl-2">Packages</label>
                                <div className="px-2">
                                  <select
                                    value={selectedPackage}
                                    disabled={!selectedCustomer}
                                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                                    onChange={(e) => {
                                      setSelectedPackage(e.target.value);
                                      handlePackageChange(e.target.value);
                                    }}
                                  >
                                    <option value="">Select Package</option>
                                    {productsPackages?.length > 0 ? productsPackages.map((packageItem) => (
                                      <option key={packageItem.id} value={packageItem.id}>
                                        {packageItem.name}
                                      </option>
                                    )) : <option value="">No Package</option>}
                                  </select>
                                </div>
                              </div>

                              <div className="text-5xl text-right font-semibold text-slate-900 tabular-nums">
                                <h1>${calculateTotalAmountWithTax()}</h1>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto my-2">
                      <table className="w-full min-w-max table-auto text-left my-2">
                        <thead>
                          <tr>
                            {TABLE_HEAD.map((head) => (
                              <th
                                key={head}
                                className="border-y border-slate-200 bg-slate-50/70 p-4"
                              >
                                <Typography
                                  variant="small"
                                  className="text-xs font-semibold leading-none text-slate-500"
                                >
                                  {head}
                                </Typography>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {selectedProducts.map((item, index) => (
                            <tr key={index}>
                              <td className="p-4 border-b border-slate-100">
                                {index !== (selectedProducts.length - 1) ?
                                  <div className="flex flex-col">
                                    <div className="w-80 h-[97%] mx-2 p-2 border border-slate-200 rounded-md text-sm text-slate-700">
                                      {item.name}
                                    </div>
                                    {/* Product description */}
                                    <div>
                                      <input
                                        id="description"
                                        name="description"
                                        className="w-80 h-[30%] mx-2 p-1 rounded-md text-slate-600 text-xs placeholder:text-slate-400 focus:outline-none"
                                        type="text"
                                        value={item.description as any}
                                        onChange={(e) => { setSelectedProducts((prev) => { const newProducts = [...prev]; newProducts[index].description = e.target.value; return newProducts }) }}
                                        onBlur={handleBlur}
                                        autoComplete="off"
                                        placeholder="Description"
                                      />
                                    </div>
                                  </div>
                                  :
                                  <div ref={productInputRef} className="relative w-fit">
                                    <input
                                      className="w-80 m-2 rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
                                      <ul className="fixed bg-white border border-slate-200 rounded-md shadow-lg overflow-y-auto min-h-24 max-h-32 w-80"
                                        style={{
                                          top: productsPosition.top,
                                          left: productsPosition.left,
                                          width: productsPosition.width,
                                          zIndex: 9999,
                                        }}
                                      >
                                        {products?.length > 0 ? (
                                          products
                                            .filter(product =>
                                              product?.name?.toLowerCase().includes(productSearchText.toLowerCase())
                                            )
                                            .map(product => (
                                              <li
                                                key={product.id}
                                                className="cursor-pointer px-2 py-1 rounded-sm text-sm text-slate-700 hover:bg-slate-100"
                                                onClick={() => {
                                                  handleProductChange(index, item.quantity, product.id);
                                                  setShowProductSuggestions(false);
                                                }}
                                              >
                                                {product.name}
                                              </li>
                                            ))
                                            .concat(
                                              products.filter(product =>
                                                product?.name?.toLowerCase().includes(productSearchText.toLowerCase())
                                              ).length === 0
                                                ? [
                                                  <li key="no-product" className="px-2 py-1 rounded-sm flex justify-between items-center">
                                                    <span>No Product Found</span>
                                                    <Button
                                                      className="rounded"
                                                      size="sm"
                                                      color="teal"
                                                      onClick={() => {
                                                        setShowProductSuggestions(false);
                                                        dispatch({
                                                          type: "SET_PRODUCT_DATA",
                                                          payload:
                                                            true,
                                                        });
                                                      }}
                                                    >
                                                      Add New Product
                                                    </Button>
                                                  </li>
                                                ]
                                                : []
                                            )
                                        ) : (
                                          <li className="px-2 py-1 rounded-sm flex justify-between items-center">
                                            <span>No Product Found</span>
                                            <Button
                                              className="rounded"
                                              size="sm"
                                              color="teal"
                                              onClick={() => {
                                                setShowProductSuggestions(false);
                                                dispatch({
                                                  type: "SET_PRODUCT_DATA",
                                                  payload:
                                                    true,
                                                });
                                              }}
                                            >
                                              Add New Product
                                            </Button>
                                          </li>
                                        )}
                                      </ul>

                                    )}
                                  </div>
                                }
                              </td>
                              <td className="p-4 border-b border-slate-100">
                                <input
                                  type="number"
                                  min={1}
                                  className="w-14 p-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(index, e.target.value)
                                  }
                                />
                              </td>
                              <td className="p-4 border-b border-slate-100">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="w-24 p-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                  value={item.price == 0 ? '' : item.price}
                                  placeholder="0.00"
                                  onChange={(e) =>
                                    handlePriceChange(index, e.target.value)
                                  }
                                />
                              </td>
                              <td className="p-4 border-b border-slate-100">
                                <input
                                  type="checkbox"
                                  checked={selectedCustomer?.taxable && item.taxable}
                                  readOnly
                                />
                              </td>
                              <td className="p-4 border-b border-slate-100 text-right">
                                <Typography
                                  variant="small"
                                  className="text-sm text-slate-700 tabular-nums"
                                >
                                  {calculateAmount(item.price, item.quantity)}
                                </Typography>
                              </td>
                              <td className="p-4 border-b border-slate-100">
                                <DatePicker
                                  selected={item.replacement_reminder_date}
                                  onChange={(date) => {
                                    const newProducts = [...selectedProducts];
                                    newProducts[index].replacement_reminder_date = date;
                                    setSelectedProducts(newProducts);
                                  }}
                                  className="w-36 p-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                                  dateFormat="MM/dd/yyyy"
                                  placeholderText="Select a date"
                                />
                              </td>
                              <td className="p-4 border-b border-slate-100 text-center px-4 py-2">
                                {index !== selectedProducts.length - 1 ?
                                  <XCircleIcon
                                    onClick={() => handleRemoveProduct(index)}
                                    className="h-6 w-6 text-slate-400 hover:text-red-600 cursor-pointer"
                                  />
                                  :
                                  null
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="w-full min-w-0 lg:flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {[
                          { id: 'manufactureWarranty', name: 'manufactureWarranty', label: 'Manufacture Warranty', value: values.manufactureWarranty },
                          { id: 'roadHazardWarranty', name: 'roadHazardWarranty', label: 'Road Hazard Warranty', value: values.roadHazardWarranty },
                          { id: 'flatRepairWarranty', name: 'flatRepairWarranty', label: 'Flat Repair Warranty', value: values.flatRepairWarranty },
                          { id: 'rotationWarranty', name: 'rotationWarranty', label: 'Rotation Warranty', value: values.rotationWarranty },
                          { id: 'noWarranty', name: 'noWarranty', label: 'No Warranty', value: values.noWarranty },
                          { id: 'balanceWarranty', name: 'balanceWarranty', label: 'Balance', value: values.balanceWarranty },
                        ].map((item) => (
                          <label
                            key={item.id}
                            htmlFor={item.id}
                            className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm cursor-pointer w-fit"
                          >
                            <input
                              id={item.id}
                              name={item.name}
                              type="checkbox"
                              checked={item.value}
                              onChange={handleChange}
                              className="h-4 w-4 shrink-0 text-teal-700 border-slate-300 rounded focus:ring-teal-600 cursor-pointer"
                            />
                            <span className="leading-snug break-words">{item.label}</span>
                          </label>
                        ))}
                      </div>


                      <div className="w-full lg:w-96 lg:shrink-0 rounded-md border border-slate-200 my-1 font-normal">
                        {/* {!edit && ( */}
                          <div className="flex items-center justify-between px-2 lg:p-2 border-b border-slate-200 bg-amber-50">
                            <div className="text-md">
                              <Input
                                type="number"
                                step="any"
                                min={0}
                                className="w-fit no-spinner text-left border-none focus:border-none focus:ring-0"
                                placeholder="Lumsum"
                                value={lumSum === 0 ? '' : lumSum}
                                readOnly={isLumSumApplied}
                                onFocus={() => {
                                  if (isLumSumApplied) {
                                    toast.info("Reset lumsum before updating value");
                                  }
                                }}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  if (isLumSumApplied) {
                                    toast.info("Reset lumsum before updating value");
                                    return;
                                  }
                                  setLumSum(parseFloat(e.target.value) || 0);
                                }}
                                labelProps={{
                                  className: "before:content-none after:content-none",
                                }}
                              />
                            </div>
                            {!isLumSumApplied ? (
                              <Button className="" disabled={lumSum === 0} size="sm" color="teal" onClick={handleLumSum}>Apply</Button>
                            ) : (
                              <Button className="" size="sm" color="red" onClick={handleResetLumSum}>Reset</Button>
                            )}
                          </div>
                        {/* )} */}
                        <div className="flex justify-between p-2">
                          <div className="text-md">
                            <h1>Subtotal</h1>
                          </div>
                          <div className="text-md">
                            <h1>${parseFloat(totalAmount as any).toFixed(2)}</h1>
                          </div>
                        </div>                        

                        <div className="flex flex-col divide-y border-y">
                          {Object.values(appliedTaxes).map((tax, ind) => (
                            <div key={ind} className="flex justify-between">
                              <span className="rounded w-min p-2 whitespace-nowrap basis-[50%] text-sm text-slate-600" >{`${tax.tax_name ?? ""} (${String(tax.tax_rate ?? "")}${String(tax.tax_type ?? "")})`}</span>
                              <span className="w-fit p-2 rounded-md basis-[33.33%]" >{ }</span>
                              <span className="p-2 w-fit text-right basis-[50%] text-sm text-slate-700 tabular-nums">{tax?.tax_amount}</span>
                            </div>
                          ))}
                        </div>
                       
                        <div className="flex justify-between border-b">
                          <span className="rounded w-min p-2 whitespace-nowrap basis-[50%] text-sm text-slate-600">
                            Labour
                          </span>
                          <span className="w-fit p-2 rounded-md basis-[33.33%]" >{ }</span>
                          <span className="p-2 w-fit text-right basis-[50%] text-sm text-slate-700 tabular-nums">{labour?.toFixed(2)}</span>
                        </div>
                       
                        <div className="flex justify-between p-2">
                          <div className="text-md">
                            <h1>Discount</h1>
                          </div>
                          <div className="text-md">
                            <input
                              type="number"
                              step="any"
                              min={0}
                              className="w-fit no-spinner text-right"
                              value={discount === 0 ? '' : discount}
                              onChange={(e) => {
                                const enteredValue = Number(e.target.value);
                                const currentTotal = parseFloat(calculateTotalAmountWithTax());
                                if (enteredValue <= currentTotal * 0.25) {
                                  setDiscount(enteredValue);
                                } else {
                                  setDiscount(currentTotal * 0.25);
                                }
                              }}

                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 font-semibold text-slate-900 bg-slate-50">
                          <div className="text-md">
                            <h1>Total</h1>
                          </div>
                          <div className="text-md">
                            <h1>${calculateTotalAmountWithTax()}</h1>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!state?.invoice?.isViewOpen ? (
                  <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
                    {/* <ReactToPrint
                    ref={printRef}
                    trigger={() => <button
                      onClick={() => setPrintInvoice(selectedInvoice)}
                      className={`w-28 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50 ${!edit ? 'hidden' : ''}`}
                      type="button"
                    >
                      Print
                    </button>}
                    content={() => componentRef.current}
                  /> */}
                    {edit && (
                      <button className="w-auto rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60"
                        onClick={() => { setEdit(false); dispatch({ type: 'SET_INVOICE_VIEW', payload: true }); clearForm(formikProps); setResetForm(!resetForm) }}
                        type="button"
                      >
                        Back
                      </button>
                    )}

                    {/* {edit && (
                      <button className=" w-28 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                        onClick={() => { clearForm(formikProps); setResetForm(!resetForm) }}
                        type="button"
                      >
                        Reset
                      </button>
                    )} */}

                    <button
                      className="w-auto rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60"
                      onClick={() => clearForm(formikProps)}
                      type="button"
                    >
                      Clear
                    </button>
                    <button
                      disabled={isLoading}
                      className="w-28 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                      type="submit"
                    >
                      {!isLoading ?
                        <span>{edit ? 'Update' : 'Save'}</span> :
                        <div className="flex items-center justify-center h-fit">
                          <div className="w-6 h-6 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
                        </div>
                      }
                    </button>
                  </div>
                ) :
                  <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5"></div>
                }
              </div>
            </div>
          </form>
        )}
      </Dialog>
      <CustomerForm open={isCustomerFormOpen} close={closeCustomerForm} refresh={refresh} setRefresh={setRefresh} setSelectedCustomer={setSelectedCustomer} selectedItem={null} setSelectedItem={null} />
      {selectedCustomer ? <CustomerVehicleForm open={isCustomerVehicleFormOpen} close={closeCustomerVehicleForm} refresh={refresh} setRefresh={setRefresh} CustomerId={selectedCustomer?.id} getCustomerDetails={getCustomerDetails} /> : null}
      {printInvoice && Object.keys(printInvoice).length > 0 ? <PrintView view={false} printInvoice={printInvoice} ref={componentRef} appliedTaxes={appliedTaxes} /> : null}
      <ProductForm open={state?.product?.openForm} close={() => dispatch({ type: "SET_PRODUCT_DATA", payload: false })} refresh={refresh} setRefresh={setRefresh} selectedItem={null} setSelectedItem={null} />

      {/* Package Preview Modal */}
      {showPackageModal && packagePreview && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out animate-fadeIn"
          />
          <div className="relative bg-white p-6 rounded-xl shadow-2xl z-[10000]
                 transition-transform duration-300 ease-out animate-scaleIn w-[90%] max-w-xl max-h-[90%] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Package: {packagePreview.name}</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {packagePreview.Product.map((product: any) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center border border-slate-200 p-2 rounded-md"
                >
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-500">Original Quantity: {product.package_product.quantity}</p>
                    <p className="text-sm text-slate-500">Price: ${product.price}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-[13px] font-medium text-slate-700">Update Quantity</label>
              <input
                type="number"
                min={1}
                value={modalQuantity}
                onChange={(e) => (e.target.value as any) > 0 ? setModalQuantity(Number(e.target.value)) : setModalQuantity(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 mt-1"
              />
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => {
                  setShowPackageModal(false);
                  setPackagePreview(null);
                  setSelectedPackage("");
                }}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60"
              >
                Discard
              </button>
              <button
                disabled={modalQuantity < 1}
                onClick={() => {
                  const updatedItems = [...selectedProducts];

                  // Remove empty row (if present at the end)
                  if (updatedItems.length && updatedItems[updatedItems.length - 1].product === "") {
                    updatedItems.pop();
                  }

                  packagePreview.Product.forEach((product: any) => {
                    const existingIndex = updatedItems.findIndex(p => p.product === product.id);
                    if (existingIndex !== -1) {
                      updatedItems[existingIndex].quantity += (product.package_product.quantity * modalQuantity);
                    } else {
                      updatedItems.push({
                        id: product.id,
                        product: product.id,
                        name: product.name,
                        quantity: product.package_product.quantity * modalQuantity,
                        price: product.price,
                        taxable: product.taxable,
                        Tax: product.Tax,
                        Category: product.Category,
                        description: "",
                        replacement_reminder_date: null
                      });
                    }
                  });

                  // Add an empty row again
                  updatedItems.push({
                    id: "",
                    product: "",
                    description: "",
                    name: "",
                    quantity: 1,
                    price: 0,
                    taxable: false,
                    Tax: [],
                    replacement_reminder_date: null
                  });

                  setSelectedProducts(updatedItems);
                  recalculateTaxes(updatedItems);
                  
                  // Recalculate labour
                  const calculatedLabour = calculateLabour(updatedItems.filter(p => p.id));
                  setLabour(calculatedLabour);
                  
                  setProductSearchText("");
                  setSelectedPackage("");
                  setShowPackageModal(false);
                  setPackagePreview(null);
                }}
                className={`rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 ${modalQuantity < 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Add to Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyPopUpForm;