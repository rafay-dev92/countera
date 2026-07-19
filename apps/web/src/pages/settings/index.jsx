import React, { useEffect, useState } from 'react';
import { Typography } from '@material-tailwind/react';
import Taxes from './taxes/taxes';
import Users from './users/users';
import Profile from './general/general';
import {
  Cog8ToothIcon
} from "@heroicons/react/24/solid";
import { State } from '@/state/Context';
import Vehicles from './vehicles/vehicles';
import ProductCategories from './productCategories/productCategories';
import Packages from './packages';
import Archived from './archived';
import { ChevronDownIcon } from 'lucide-react';

export function Settings() {
  const { state } = State();
  const [activeSection, setActiveSection] = useState('profile');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const sections = {
    profile: {
      title: 'General',
      component: <Profile />
    },
    tax: {
      title: 'Tax',
      component: <Taxes />
    },
    Users: {
      title: 'Users',
      component: <Users />
    },
    Vehicles: {
      title: 'Vehicles',
      component: <Vehicles />
    },
    Product_Categories: {
      title: 'Product Categories',
      component: <ProductCategories />
    },
    Packages: {
      title: 'Product Packages',
      component: <Packages />
    },
    Archived: {
      title: 'Archived Invoices',
      component: <Archived />
    },
  };

  const handleSectionClick = (section) => {
    setActiveSection(section)
    setIsDropdownOpen(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Settings</h1>
      </div>
      {Object.keys(state.userInfo).length !== 0 && (state.userInfo.Permission?.includes("setting:view") ? (
        <div className="mt-5">
          {/* Mobile Dropdown - visible on small screens */}
          <div className="block lg:hidden mb-4">
            <div className="relative bg-white rounded-md shadow-md">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 text-left flex items-center justify-between bg-white rounded-md border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                <span className="font-medium text-slate-700">{sections[activeSection].title}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg">
                  <ul className="py-1">
                    {Object.keys(sections).map((section) => (
                      <li key={section}>
                        <button
                          onClick={() => handleSectionClick(section)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${activeSection === section ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-700"
                            }`}
                        >
                          {sections[section].title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Desktop/Tablet Layout - hidden on small screens */}
          <div className="hidden lg:flex flex-row w-full gap-4">
            {/* Sidebar Navigation */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 h-max w-[40%] xl:w-[30%] 2xl:w-[20%]">
              <nav>
                <ul className="space-y-1">
                  {Object.keys(sections).map((section) => (
                    <li key={section}>
                      <button
                        onClick={() => handleSectionClick(section)}
                        className={`w-full px-4 py-2 text-left rounded-md text-xs xl:text-sm whitespace-nowrap transition-colors duration-200 ${activeSection === section
                          ? "bg-teal-50 font-semibold text-teal-700"
                          : "font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                      >
                        {sections[section].title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 flex-grow">
              <div className="overflow-y-auto h-[70vh]">{sections[activeSection].component}</div>
            </div>
          </div>

          {/* Mobile Content Area - full width on small screens */}
          <div className="block lg:hidden">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="overflow-y-auto max-h-[60vh]">{sections[activeSection].component}</div>
            </div>
          </div>
        </div>
      ) :
        <div className="text-red-600 text-center mt-10">
          <Typography variant="h6">You do not have permission to view this page.</Typography>
        </div>
      )}
    </div>
  );
};

export default Settings;
