import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Navbar,
  Button,
  IconButton,
  Breadcrumbs,
  Typography,
  Spinner,
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";
import {
  useMaterialTailwindController,
  setOpenSidenav,
} from "@/context";
import { State } from "@/state/Context";
import { useConfirm } from "@/context/confirmContext";

export function DashboardNavbar() {
  const confirm = useConfirm();
  const { state, dispatch } = State();
  const navigate = useNavigate()
  const [controller, dispatcher] = useMaterialTailwindController();
  const { fixedNavbar, openSidenav } = controller;
  const { pathname } = useLocation();
  const [layout, page] = pathname.split("/").filter((el) => el !== "");

  const logout = async () => {
    const confirmLogout = await confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;
    dispatch({ type: 'RESET' })
    localStorage.removeItem('Token');
    localStorage.removeItem('RefreshToken');
    localStorage.removeItem('sessionExp');
    navigate('/auth/sign-in');
  }

  return (
    <Navbar
      color="white"
      className="mb-5 sticky top-0 z-40 border-blue-gray-900 "
      fullWidth
      blurred={fixedNavbar}
    >
      <div className="flex flex-row">
        <IconButton
          variant="text"
          color="blue-gray"
          className="grid xl:hidden"
          onClick={() => setOpenSidenav(dispatcher, !openSidenav)}
        >
          <Bars3Icon strokeWidth={3} className="h-6 w-6 text-blue-gray-500" />
        </IconButton>

        <div className="flex w-full flex-row justify-end items-center">
          <div>
            <h3 className="font-semibold text-sm text-gray-600 uppercase">
              {state?.userInfo && state.userInfo.first_name && state.userInfo.last_name ? (
                `${state.userInfo.first_name} ${state.userInfo.last_name} (${state.userInfo.role})`
              ) : (
                <Spinner className="mxl-auto h-5 w-5 text-gray-900/50" />
              )}
            </h3>
          </div>
          <Button
            variant="text"
            color="blue-gray"
            className=" items-center gap-1 px-4 xl:flex hidden normal-case"
            onClick={logout}
          >
            <UserCircleIcon className="h-7 w-7 text-blue-gray-500" />
            Sign Out
          </Button>
          <IconButton
            variant="text"
            color="blue-gray"
            className="grid xl:hidden"
            onClick={logout}
          >
            <UserCircleIcon className="h-7 w-7 text-blue-gray-500" />
          </IconButton>
        </div>
      </div>
    </Navbar>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;
