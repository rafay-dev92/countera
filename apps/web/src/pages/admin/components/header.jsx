import React from "react";
import { Button } from "@material-tailwind/react";
import { State } from "@/state/Context";
import { useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useConfirm } from "@/context/confirmContext";

const Header = () => {
    const confirm = useConfirm();
    const { dispatch } = State();
    const navigate = useNavigate();

    const logout = async () => {
        const confirmLogout = await confirm("Are you sure you want to logout?");
        if (!confirmLogout) return;
        dispatch({ type: 'RESET' })
        localStorage.removeItem('Token');
        localStorage.removeItem('sessionExp');
        navigate('/auth/sign-in')
    }

    return (
        <header className="flex items-center justify-between p-4 bg-white shadow">
            <div></div>
            <div className="flex items-center">
                <Button
                    variant="text"
                    color="blue-gray"
                    className=" items-center gap-1 px-4 xl:flex hidden normal-case"
                    onClick={logout}
                >
                    <UserCircleIcon className="h-7 w-7 text-blue-gray-500" />
                    Sign Out
                </Button>
            </div>
        </header>
    );
};

export default Header;
