import {
  Squares2X2Icon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  ChartBarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Home, Customers, Invoice, Quotation, WorkOrder, Product, Inspection, Appointments, Settings, Reports } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";

export interface RoutePage {
  icon?: React.ReactNode;
  name: string;
  path: string;
  section?: string;
  element: React.ReactNode;
}

export interface RouteGroup {
  layout: "dashboard" | "auth" | "super-admin";
  title?: string;
  pages: RoutePage[];
}

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes: RouteGroup[] = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <Squares2X2Icon {...icon} />,
        name: "Dashboard",
        path: "/home",
        section: "Finance",
        element: <Home />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "Invoices",
        path: "/invoice",
        section: "Finance",
        element: <Invoice />,
      },
      {
        icon: <CalculatorIcon {...icon} />,
        name: "Quotations",
        path: "/quotation",
        section: "Finance",
        element: <Quotation />,
      },
      {
        icon: <UserGroupIcon {...icon} />,
        name: "Customers",
        path: "/customers",
        section: "Finance",
        element: <Customers />,
      },
      {
        icon: <CubeIcon {...icon} />,
        name: "Products",
        path: "/products",
        section: "Finance",
        element: <Product />,
      },
      {
        icon: <ChartBarIcon {...icon} />,
        name: "Reports",
        path: "/reports",
        section: "Finance",
        element: <Reports />,
      },
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "Work Orders",
        path: "/work-orders",
        section: "Auto shop",
        element: <WorkOrder />,
      },
      {
        icon: <CalendarDaysIcon {...icon} />,
        name: "Appointments",
        path: "/appointments",
        section: "Auto shop",
        element: <Appointments />,
      },
      {
        icon: <MagnifyingGlassIcon {...icon} />,
        name: "Inspections",
        path: "/inspection",
        section: "Auto shop",
        element: <Inspection />,
      },
      {
        icon: <Cog6ToothIcon {...icon} />,
        name: "Settings",
        path: "/settings",
        section: "Admin",
        element: <Settings />,
      },
    ],
  },
  {
    layout: "auth",
    pages: [
      {
        name: "Sign In",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        name: "Sign Up",
        path: "/sign-up",
        element: <SignUp />,
      },
    ],
  },
];

export default routes;
