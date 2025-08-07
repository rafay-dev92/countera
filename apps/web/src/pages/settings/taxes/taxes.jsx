import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Tooltip, IconButton, Spinner } from "@material-tailwind/react";
import TaxForm from "./taxForm";
import { fetchTaxes } from "@/services/fetchTaxes";
import { delTax } from "@/services/delTax";
import { State } from "@/state/Context";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useConfirm } from "@/context/confirmContext";

const TABLE_HEAD = ["Name", "Rate", "Type", "Actions"];

function Taxes() {
  const confirm = useConfirm();
  const { state } = State();
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState([]);
  const [refresh, setRefresh] = useState(false);

  // for edit of a vehicle 
  const [selectedItem, setSelectedItem] = useState(null);

  // for filtering
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  useEffect(() => {
    getTaxes();
  }, [refresh])

  const getTaxes = async () => {
    try {
      const taxes = await fetchTaxes(state.userToken);
      setTaxes(await taxes.json());
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong")
    }
  }
  // Function to handle deletion of selected items
  const handleDelete = async (id) => {
    const confirmed = await confirm("Do you really want to delete this tax?");
    if (!confirmed) return;
    try {
      const res = await delTax(id, state.userToken);
      const tax = await res.json();
      if (res.status === 200) {
        toast.success(tax.message)
      }
      else if (res.status === 404) {
        toast.info(tax.message)
      }
      else if (res.status === 500) {
        toast.error("You must delete its foreign key relations first");
      }
      setRefresh(!refresh);
    } catch (error) {
      console.log(error)
      showToastMessage('error', "You must delete its foreign key relations first");
    }
  };

  // Modify handleRowSelect to update the selected item's data
  const handleEditTax = (index) => {
    // Assuming currentItems holds the filtered rows for display
    const selected = currentItems[index];
    setSelectedItem(selected);
    openPopup();
  };

  const filteredRows = taxes.filter(
    ({ name, type }) =>
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

  // Function to handle items per page change
  const handleItemsPerPageChange = (event) => {
    const selectedItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(selectedItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-gray-900/50" />
  }
  return (
    <>
      <Card className="w-full max-h-[80vh] overflow-y-auto">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex flex-col md:flex-row items-center w-full h-max py-3 gap-4">
            <div className="w-full md:w-auto flex items-center justify-start gap-2">
              <Typography variant="h5" color="blue-gray" className="flex items-center text-lg md:text-xl">
                Taxes
              </Typography>
              <Tooltip content="Add new Tax" >
                <PlusCircleIcon onClick={openPopup} className="ml-2 h-6 w-6 md:h-7 md:w-7 text-blue-600 cursor-pointer" />
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

        <CardBody className="p-2 overflow-auto px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {TABLE_HEAD.map((head) => (
                    <th
                      key={head}
                      className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 md:p-4"
                    >
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70 text-xs md:text-sm"
                      >
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map(({ name, rate, type, id }, index) => {
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
                          className="text-blue-gray font-normal hover:underline text-xs md:text-sm"
                          onClick={() => {
                            handleEditTax(index);
                          }}
                        >
                          {name}
                        </Link>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal text-xs md:text-sm"
                        >
                          {rate}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal text-xs md:text-sm"
                        >
                          {type}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Tooltip content="Delete Tax">
                          <IconButton variant="text" onClick={() => handleDelete(id)}>
                            <TrashIcon className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                },
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-blue-gray-50 p-4 gap-4">
          <Typography variant="small" color="blue-gray" className="font-normal text-xs md:text-sm">
            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRows.length)} of {filteredRows.length}
          </Typography>
          <Typography variant="small" color="blue-gray" className="font-normal text-xs md:text-sm">
            Page {currentPage} of {Math.ceil(filteredRows.length / itemsPerPage)}
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
              className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              size="sm"
              disabled={indexOfLastItem >= filteredRows.length}
              onClick={() => paginate(currentPage + 1)}
              className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
            >
              Next
            </Button>
          </div>
        </CardFooter>

      </Card>
      <TaxForm taxData={selectedItem} setTaxData={setSelectedItem} open={isOpen} close={closePopup} refresh={refresh} setRefresh={setRefresh} />
    </>
  );
}

export default Taxes;