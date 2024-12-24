import React from "react";
import { NavLink } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";

const Sidebar = ({ routes }) => {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;

  return (
    <aside className={`bg-gradient-to-br from-gray-800 to-gray-800 ${openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50  h-[calc(100vh-0px)] w-72 transition-transform duration-300 xl:translate-x-0 `}>
      <Typography
        variant="h6"
        color="white"
        className="w-full py-6 px-2 text-2xl text-orange-500 italic font-bold text-center"
      // color={sidenavType === "dark" ? "white" : "blue-gray"}
      >
        Sales4x Admin Panel
      </Typography>
      <div className="m-4">
        {routes.map(({ layout, title, pages }, key) => (
          <ul key={key} className="mb-4 flex flex-col gap-1">
            {layout === 'super-admin' &&
              pages.map(({ icon, name, path }) => (
                <li key={name}>
                  <NavLink to={`/${layout}${path}`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        color={
                          isActive
                            ? sidenavColor
                            : sidenavType === "dark"
                              ? "white"
                              : "blue-gray"
                        }
                        className="flex items-center gap-4 px-4 capitalize"
                        fullWidth
                      >
                        {icon}
                        <Typography
                          color="inherit"
                          className="font-medium capitalize"
                        >
                          {name}
                        </Typography>
                      </Button>
                    )}
                  </NavLink>
                </li>
              ))}
          </ul>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
