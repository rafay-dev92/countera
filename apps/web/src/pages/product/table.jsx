
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CubeIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
    Card,
    CardHeader,
    Input,
    Typography,
    Button,
    CardBody,
    CardFooter,
    IconButton,
    Tooltip,
    Checkbox,
    Spinner,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductForm from "../../utils/forms/productForm";
import { fetchProducts } from "@/services/fetchProducts";
import { delProduct } from "@/services/delProduct";
import { toast } from 'react-toastify';
import { State } from "@/state/Context";
import { useConfirm } from "@/context/confirmContext";

const TABLE_HEAD = ["Name", "Price", "Cost", "ItemCode", "Type", "Taxable", "Actions"];

export function Product() {
    const confirm = useConfirm();
    const { state, dispatch } = State();
    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [finalItems, setFinalItems] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(true);

    // for edit of a customer 
    const [selectedItem, setSelectedItem] = useState(null);

    // Modify handleRowSelect to update the selected item's data
    const handleEditProduct = (index) => {
        const selected = finalItems[index];
        setSelectedItem(selected);
        openPopup();
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
    
    const getProducts = async () => {
        try {
            const filters = {
                type: ["Product", "Service"]
            };

            if (debouncedTerm && debouncedTerm.trim()) {
                filters.name = debouncedTerm;
            }

            const response = await fetchProducts(state.userToken, currentPage, itemsPerPage, filters);
            const totalProducts = await response.json();
            setFinalItems(totalProducts?.data || []);
            setTotalCount(totalProducts.total || 0);
        } catch (error) {
            console.error(error.message);
            showToastMessage('error', "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);
    
    useEffect(() => {
        getProducts();
    }, [refresh, currentPage, itemsPerPage, debouncedTerm]);

    // Function to handle header checkbox change
    const handleSelectAll = (event) => {
        const checked = event.target.checked;
        setSelectAll(checked);

        if (checked) {
            const allRowsIndexes = finalItems.map((_, index) => index);
            setSelectedRows(allRowsIndexes);
        } else {
            setSelectedRows([]);
        }
    };

    // Function to handle individual row checkbox change
    const handleRowSelect = (index) => {
        const selectedIndex = selectedRows.indexOf(index);
        let newSelectedRows = [];

        if (selectedIndex === -1) {
            newSelectedRows = newSelectedRows.concat(selectedRows, index);
        } else if (selectedIndex === 0) {
            newSelectedRows = newSelectedRows.concat(selectedRows.slice(1));
        } else if (selectedIndex === selectedRows.length - 1) {
            newSelectedRows = newSelectedRows.concat(selectedRows.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelectedRows = newSelectedRows.concat(
                selectedRows.slice(0, selectedIndex),
                selectedRows.slice(selectedIndex + 1)
            );
        }
        setSelectedRows(newSelectedRows);
    };

    // Function to handle items per page change
    const handleItemsPerPageChange = (event) => {
        const selectedItemsPerPage = parseInt(event.target.value, 10);
        setItemsPerPage(selectedItemsPerPage);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

    // Function to handle deletion of selected items
    const handleDelete = async (id) => {
        const confirmed = await confirm("Do you really want to delete this product?");
        if (!confirmed) return;
        try {
            const res = await delProduct(id, state.userToken);
            const product = await res.json();
            if (res.status === 200) {
                showToastMessage('success', product.message)
            }
            else if (res.status === 404) {
                showToastMessage('info', product.message)
            }
            else if (res.status === 500) {
                showToastMessage('error', "You must delete its foreign key relations first");
            }
            setRefresh(!refresh);
        } catch (error) {
            console.error(error)
            showToastMessage('error', "You must delete its foreign key relations first");
        }
    };


    // Function to handle pagination
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Popup state
    const [isOpen, setIsOpen] = useState(false);
    const openPopup = () => {
        // setIsOpen(true);
        dispatch({
            type: "SET_PRODUCT_DATA",
            payload:
                true,
        });
    };
    const closePopup = () => {
        // setIsOpen(false);
        dispatch({
            type: "SET_PRODUCT_DATA",
            payload: false
        });
    };

    if (loading) {
        return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-gray-900/50" />
    }
    return (
        <>
            <Card className="h-full w-full ">
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="mb-4 sm:mb-0 flex items-center">
                        <Typography variant="h5" color="blue-gray" className="flex items-center">
                            <CubeIcon className="h-12 w-12 text-blueGray-500 ml-2" />
                            Products
                        </Typography>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center w-full mt-5">
                        <div className="w-full lg:w-2/5 flex items-center justify-center lg:justify-start gap-2">
                            <div className="w-full lg:flex-1 lg:mr-4">
                                <Input
                                    label="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                />
                            </div>
                            <div className="flex gap-2 lg:gap-4">
                                <Button className="w-full bg-blue-900 lg:w-auto" size="md" onClick={openPopup} >
                                    New
                                </Button>
                                {/* <Button className="w-full bg-red-900 lg:w-auto" size="md" onClick={handleDelete} disabled={selectedRows.length == 0} >
                                    Delete
                                </Button> */}
                            </div>
                        </div>
                        <div className="flex items-center mt-4 lg:mt-0 lg:ml-auto">
                            <Typography variant="small" color="blue-gray" className="mr-2">
                                Items per page:
                            </Typography>
                            <select
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="px-2 py-1 border border-blue-gray-300 rounded bg-white text-blue-gray-700"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="p-2 overflow-scroll px-0">
                    <table className=" w-full min-w-max table-auto text-left">
                        <thead>
                            <tr>
                                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox text-blue-500 rounded border-gray-400 shadow-sm ml-1"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                        />
                                    </label>
                                </th>
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
                        <tbody>
                            {finalItems.map(({ id, name, price, cost, itemCode, type, taxable }, index) => {
                                const isLast = index === finalItems.length - 1;
                                const classes = isLast
                                    ? "p-4"
                                    : "p-4 border-b border-blue-gray-50";
                                const isChecked = selectedRows.includes(index);
                                return (
                                    <tr key={id}>
                                        <td className={classes}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleRowSelect(index)}
                                            />
                                        </td>
                                        <td className={classes}>
                                            <Link
                                                to="#"
                                                className="text-blue-gray font-normal hover:underline"
                                                onClick={() => {
                                                    handleEditProduct(index);
                                                }}
                                            >
                                                {name}
                                            </Link>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal"
                                            >
                                                {price}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal opacity-70"
                                            >
                                                {cost}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal opacity-70"
                                            >
                                                {itemCode}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal opacity-70"
                                            >
                                                {type}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Checkbox color="green" checked={taxable ? 'checked' : ''} readOnly />
                                        </td>
                                        <td className={classes}>
                                            <Tooltip content="Delete Product">
                                                <IconButton variant="text" onClick={() => handleDelete(id)}>
                                                    <TrashIcon className="h-6 w-6 text-red-600" />
                                                </IconButton>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardBody>
                <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Showing {startIndex} - {endIndex} of {totalCount}
                    </Typography>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Page {currentPage} of {totalPages}
                    </Typography>
                    <div className="flex gap-2">
                        <Button
                            variant="outlined"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => paginate(currentPage - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outlined"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => paginate(currentPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardFooter>

            </Card>
            <ProductForm refresh={refresh} setRefresh={setRefresh} open={isOpen} close={closePopup} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
        </>
    );
}