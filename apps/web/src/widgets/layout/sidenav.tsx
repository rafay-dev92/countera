import { Link, NavLink } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import type { RouteGroup, RoutePage } from "@/routes";

interface SidenavSection {
  name: string;
  pages: RoutePage[];
}

export function Sidenav({ routes }: { routes: RouteGroup[] }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openSidenav } = controller;

  const dashboardPages =
    routes.find((route) => route.layout === "dashboard")?.pages ?? [];
  const sections: SidenavSection[] = [];
  dashboardPages.forEach((page) => {
    const name = page.section ?? "General";
    let section = sections.find((s) => s.name === name);
    if (!section) {
      section = { name, pages: [] };
      sections.push(section);
    }
    section.pages.push(page);
  });

  return (
    <aside
      className={`${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 xl:translate-x-0`}
    >
      <div className="relative flex h-14 shrink-0 items-center border-b border-slate-200 px-4">
        <Link to="/dashboard/home" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-700 text-sm font-bold text-white">
            C
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            Countera
          </span>
        </Link>
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 xl:hidden"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        {sections.map(({ name, pages }) => (
          <div key={name}>
            <p className="px-2.5 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {name}
            </p>
            <ul className="flex flex-col gap-0.5">
              {pages.map(({ icon, name: label, path }) => (
                <li key={label} onClick={() => setOpenSidenav(dispatch, false)}>
                  <NavLink
                    to={`/dashboard${path}`}
                    className={({ isActive }) =>
                      `relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-teal-50 font-semibold text-teal-700"
                          : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute -left-3 bottom-2 top-2 w-0.5 rounded bg-teal-700" />
                        )}
                        {icon}
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidenav;
