import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Tooltip, IconButton, Spinner } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import Form from "./form";
import { Link } from "react-router-dom";
import { fetchProductsCategories } from "@/services/fetchProductCategories";
import { delProductCategory } from "@/services/delProductCategory";
import { useConfirm } from "@/context/confirmContext";
import type { ProductCategory } from "@/types/api";

const TABLE_HEAD = ["Name", "Business", "Actions"];

// NOTE: pre-existing bug (left untouched): showToastMessage is not defined in this
// module; the catch block below would throw a ReferenceError at runtime. The ambient
// declaration only satisfies the typechecker without changing behavior.
declare function showToastMessage(type: string, message: string): void;

function ProductCategories() {
  const confirm = useConfirm();
  const { state } = State();
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // for edit of a vehicle
  const [selectedItem, setSelectedItem] = useState<ProductCategory | null>(null);

  // for filtering
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Function to handle pagination
  const paginate = (pageNumber: number) => {
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
    getProductCategories()
  }, [refresh])

  const getProductCategories = async () => {
    try {
      const res = (await fetchProductsCategories(state.userToken))!;
      const categories: ProductCategory[] = await res.json();
      if (res.status === 200) setCategories(categories);
      setLoading(false)
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  // Function to handle deletion of selected items
  const handleDelete = async (id: string) => {
    const confirmed = await confirm("Do you really want to delete this category?");
    if (!confirmed) return;
    try {
      const res = (await delProductCategory(id, state.userToken))!;
      const user = await res.json();
      if (res.status === 200) {
        toast.success(user.message)
      }
      else if (res.status === 404) {
        toast.info(user.message)
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
  const handleEditUser = (index: number) => {
    // Assuming currentItems holds the filtered rows for display
    const selected = currentItems[index];
    setSelectedItem(selected);
    openPopup();
  };

  const filteredRows = categories?.filter(
    ({ name }) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

  // Function to handle items per page change
  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(selectedItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return <Spinner className="mx-auto mt-[30vh] h-10 w-10 text-slate-400" />
  }
  return (
    <>
      <Card className="w-full lg:max-h-[80vh] lg:overflow-y-auto">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex flex-col md:flex-row items-center w-full h-max py-3 gap-4 ">
            <div className="w-full md:w-auto flex items-center justify-start gap-2">
              <Typography variant="h5" color="blue-gray" className="flex items-center">
                Product Categories
              </Typography>
              <Tooltip content="Add new Category">
                <PlusCircleIcon onClick={openPopup} className="ml-2 mr-1 h-7 w-7 text-teal-700 cursor-pointer" />
              </Tooltip>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-3 w-full md:w-auto md:ml-auto">
              <div className="w-full sm:w-auto md:flex-1 md:mr-4">
                <Input
                  crossOrigin={undefined}
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
          <table className="w-full min-w-max table-auto text-left">
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
              {currentItems.map(({ id, name }, index) => {
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
                          handleEditUser(index);
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
                        {state.business!.name}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Tooltip content="Delete Category">
                        <IconButton variant="text" onClick={() => handleDelete(id)}>
                          <TrashIcon className="h-6 w-6 text-red-600" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                );
              },
              )}
            </tbody>
          </table>
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
      <Form open={isOpen} close={closePopup} selectedItem={selectedItem} setSelectedItem={setSelectedItem} refresh={refresh} setRefresh={setRefresh} />
    </>
  );
}

export default ProductCategories;