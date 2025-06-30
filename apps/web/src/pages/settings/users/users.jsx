import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
import { Card, CardHeader, CardBody, CardFooter, Typography, Input, Button, Tooltip, IconButton, Spinner } from "@material-tailwind/react";
import { fetchUsers } from "@/services/fetchUsers";
import { delUser } from "@/services/delUser";
import { toast } from "react-toastify";
import { State } from "@/state/Context";
import UserForm from "./userForm";
import { Link } from "react-router-dom";
import { useConfirm } from "@/context/confirmContext";

const TABLE_HEAD = ["Name", "Role", "Business", "Actions"];

function Users() {
  const confirm = useConfirm();
  const { state } = State();
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [users, setUsers] = useState([]);

  // for edit of a vehicle 
  const [selectedItem, setSelectedItem] = useState(null);

  // for filtering
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Popup state
  const [isOpen, setIsOpen] = useState(false);
  const openPopup = () => {
    setIsOpen(true);
  };
  const closePopup = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    getUsers()
  }, [refresh])

  const getUsers = async () => {
    try {
      const res = await fetchUsers(state.userToken);
      const users = await res.json();
      setUsers(users.filter(user => user.role !== 'ADMIN'));
      setLoading(false)
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  // Function to handle deletion of selected items
  const handleDelete = async (id) => {    
    const confirmed = await confirm("Do you really want to delete this user?");
    if (!confirmed) return;   
    if (state.userInfo.Permission.some(obj => obj.name === "CAN_DELETE" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
        try {
            const res = await delUser(id, state.userToken);
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
    }
    else {
        toast.error("You are not allowed to delete a user");
    }
  };

  // Modify handleRowSelect to update the selected item's data
  const handleEditUser = (index) => {
    // Assuming currentItems holds the filtered rows for display
    if (state.userInfo.Permission.some(obj => obj.name === "CAN_UPDATE" || obj.name === "IS_ADMIN" || obj.name === "IS_SUPER_ADMIN")) {
        const selected = currentItems[index];
        setSelectedItem(selected);
        openPopup();
    }
    else {
        toast.error("You are not allowed to update a user");
    }
  };

  const filteredRows = users.filter(
    ({ first_name, last_name, role }) =>
      first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase())
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
      <Card className="h-full w-full ">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex flex-col md:flex-row items-center w-full h-max py-3">
            <div className="w-full md:w-2/5 flex items-center justify-center md:justify-start gap-2">
              <Typography variant="h5" color="blue-gray" className="flex items-center">
                Users
              </Typography>
              <PlusCircleIcon onClick={openPopup} className="ml-4 mr-1 h-7 w-7 text-blue-600 cursor-pointer" />
              <span className="text-base">Add new User</span>
            </div>
            <div className="flex items-center mt-4 md:mt-0 md:ml-auto">
              <div className="w-full md:flex-1 md:mr-4">
                <Input
                  label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
              </div>
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

        <CardBody className="p-2 overflow-auto px-0">
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
              {currentItems.map(({ first_name, last_name, role, id }, index) => {
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
                        {first_name} {last_name}
                      </Link>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {role}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                      >
                        {state.business.name}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Tooltip content="Delete User">
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
      <UserForm open={isOpen} close={closePopup} selectedItem={selectedItem} setSelectedItem={setSelectedItem} refresh={refresh} setRefresh={setRefresh} />
    </>    
  );
}

export default Users;