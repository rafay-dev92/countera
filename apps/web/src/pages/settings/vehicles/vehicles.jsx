
import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
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
    Spinner,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MyPopUpForm from "./vehicleForm";
import { fetchVehicles } from "@/services/fetchVehicles";
import { delVehicle } from "@/services/delVehicle";
import { toast } from 'react-toastify';
import { State } from "@/state/Context";
import { useConfirm } from "@/context/confirmContext";

const TABLE_HEAD = ["Make", "Model"];

export default function Vehicles() {
    const confirm = useConfirm();
    const { state } = State();
    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [finalItems, setFinalItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(true);

    // for edit of a vehicle 
    const [selectedItem, setSelectedItem] = useState(null);

    // Modify handleRowSelect to update the selected item's data
    const handleEditVehicle = (index) => {
        // Assuming currentItems holds the filtered rows for display
        const selected = currentItems[index];
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

    // Fetch data from API when the component mounts
    useEffect(() => {
        getVehicles();
    }, [refresh]);

    const getVehicles = async () => {
        try {
            const vehicles = await fetchVehicles(state.userToken);
            setFinalItems(await vehicles.json());
            setLoading(false)
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong")
        }
    }

    // Function to handle header checkbox change
    const handleSelectAll = (event) => {
        const checked = event.target.checked;
        setSelectAll(checked);

        if (checked) {
            const allRowsIndexes = currentItems.map((_, index) => indexOfFirstItem + index);
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

    const filteredRows = finalItems.filter(
        ({ make, model }) =>
            make.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate the indexes of the items to display based on pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    // Function to handle items per page change
    const handleItemsPerPageChange = (event) => {
        const selectedItemsPerPage = parseInt(event.target.value, 10);
        setItemsPerPage(selectedItemsPerPage);
        setCurrentPage(1);
    };

    // Function to handle deletion of selected items
    const handleDelete = async (id) => {
        const confirmed = await confirm("Do you really want to delete this vehicle?");
        if (!confirmed) return;
        try {
            const res = await delVehicle(id, state.userToken);
            const vehicle = await res.json();
            if (res.status === 200) {
                showToastMessage('success', vehicle.message)
            }
            else if (res.status === 404) {
                showToastMessage('info', vehicle.message)
            }
            else if (res.status === 500) {
                showToastMessage('error', "You must delete its foreign key relations first");
            }
            setRefresh(!refresh);
        } catch (error) {
            console.log(error)
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
        setIsOpen(true);
    };
    const closePopup = () => {
        setIsOpen(false);
    };

    if (loading) {
        return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-slate-400" />
    }
    return (
        <>
            <Card className="w-full max-h-[80vh] overflow-y-auto">
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="flex flex-col md:flex-row items-center w-full py-3 gap-4">
                        <div className="w-full md:w-auto flex items-center justify-start gap-2">
                            <Typography variant="h5" color="blue-gray" className="flex items-center">
                                Vehicles
                            </Typography>
                            <Tooltip content="Add new vehicle">
                                <PlusCircleIcon onClick={openPopup} className="ml-2 mr-1 h-7 w-7 text-teal-700 cursor-pointer" />
                            </Tooltip>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start gap-3 w-full md:w-auto md:ml-auto">
                            <div className="w-full sm:w-auto md:flex-1 md:mr-4">
                                <Input
                                    label="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    icon={<MagnifyingGlassIcon className="h-4 w-4 md:h-5 md:w-5" />}
                                    className="text-xs md:text-sm lg:text-base"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Tooltip content="Items per page">
                                    <select
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                        className="px-2 py-2 border border-blue-gray-300 rounded bg-white text-blue-gray-700 text-xs md:text-sm"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                    </select>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="p-2 overflow-auto px-0 w-full">
                    {/* <div className="w-full text-sm"> */}
                    <table className=" w-full min-w-max table-auto text-left">
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
                        <tbody>
                            {currentItems.map(({ make, model, id }, index) => {
                                const isLast = index === currentItems.length - 1;
                                const classes = isLast
                                    ? "p-2"
                                    : "p-2 border-b border-blue-gray-50";
                                const isChecked = selectedRows.includes(index);
                                return (
                                    <tr key={id}>
                                        <td className={classes}>
                                            <Link
                                                to="#"
                                                className="text-blue-gray font-normal hover:underline"
                                                onClick={() => {
                                                    handleEditVehicle(index);
                                                }}
                                            >
                                                {make}
                                            </Link>
                                        </td>
                                        <td className={classes}>
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-normal"
                                            >
                                                {model}
                                            </Typography>
                                        </td>
                                    </tr>
                                );
                            },
                            )}
                        </tbody>
                    </table>
                    {/* </div> */}
                </CardBody>
                <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRows.length)} of {filteredRows.length}
                    </Typography>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                        Page {currentPage} of {Math.ceil(filteredRows.length / itemsPerPage)}
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
                            disabled={indexOfLastItem >= filteredRows.length}
                            onClick={() => paginate(currentPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardFooter>

            </Card>
            <MyPopUpForm open={isOpen} close={closePopup} selectedItem={selectedItem} setSelectedItem={setSelectedItem} refresh={refresh} setRefresh={setRefresh} />
        </>
    );
}