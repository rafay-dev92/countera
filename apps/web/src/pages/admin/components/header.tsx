import React from "react";
import { State } from "@/state/Context";
import { useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useConfirm } from "@/context/confirmContext";
import { logout as logoutUtil } from "@/utils/logout";

const Header = () => {
    const confirm = useConfirm();
    const { dispatch } = State();
    const navigate = useNavigate();

    const logout = async () => {
        const confirmLogout = await confirm("Are you sure you want to logout?");
        if (!confirmLogout) return;
        logoutUtil(dispatch, navigate);
    }

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
            <button
                type="button"
                onClick={logout}
                className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 xl:flex"
            >
                <UserCircleIcon className="h-6 w-6 text-slate-400" />
                Sign out
            </button>
        </header>
    );
};

export default Header;
