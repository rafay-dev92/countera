import React from "react";
import { NavLink } from "react-router-dom";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";

// Structural typing of the routes prop until the shared '@/routes' type lands.
interface SidebarRoute {
  layout: string;
  title?: string;
  pages: Array<{ icon?: React.ReactNode; name: string; path: string; element?: React.ReactNode }>;
}

interface SidebarProps {
  routes: SidebarRoute[];
}

const Sidebar = ({ routes }: SidebarProps) => {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;

  return (
    <aside className={`${openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 xl:translate-x-0`}>
      <div className="flex h-14 shrink-0 items-center border-b border-slate-200 px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-700 text-sm font-bold text-white">
            C
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            Countera
          </span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        <p className="px-2.5 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Admin panel
        </p>
        {routes.map(({ layout, title, pages }, key) => (
          <ul key={key} className="flex flex-col gap-0.5">
            {layout === 'super-admin' &&
              pages.map(({ icon, name, path }) => (
                <li key={name}>
                  <NavLink
                    to={`/${layout}${path}`}
                    className={({ isActive }) =>
                      `flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm capitalize transition-colors ${isActive
                        ? "bg-teal-50 font-semibold text-teal-700"
                        : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    {icon}
                    {name}
                  </NavLink>
                </li>
              ))}
          </ul>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
