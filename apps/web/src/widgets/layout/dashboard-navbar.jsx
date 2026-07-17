import { useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import { State } from "@/state/Context";
import { useConfirm } from "@/context/confirmContext";
import { logout as logoutUtil } from "@/utils/logout";

export function DashboardNavbar() {
  const confirm = useConfirm();
  const { state, dispatch } = State();
  const navigate = useNavigate();
  const [controller, dispatcher] = useMaterialTailwindController();
  const { openSidenav } = controller;

  const logout = async () => {
    const confirmLogout = await confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;
    logoutUtil(dispatch, navigate);
  };

  const { userInfo, business } = state ?? {};
  const initials =
    userInfo?.first_name && userInfo?.last_name
      ? `${userInfo.first_name[0]}${userInfo.last_name[0]}`.toUpperCase()
      : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
      <button
        type="button"
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 xl:hidden"
        onClick={() => setOpenSidenav(dispatcher, !openSidenav)}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {business?.name && (
        <div className="flex min-w-0 items-center gap-2.5">
          {business?.logo && (
            <img
              src={business.logo}
              alt={`${business.name} logo`}
              className="h-7 w-7 rounded-md border border-slate-200 object-cover"
            />
          )}
          <span className="truncate text-sm font-medium text-slate-900">
            {business.name}
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        {userInfo?.first_name && (
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-medium leading-tight text-slate-900">
              {userInfo.first_name} {userInfo.last_name}
            </p>
            <p className="text-xs leading-tight text-slate-500 capitalize">
              {userInfo.role?.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>
        )}
        {initials && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
            {initials}
          </span>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;
