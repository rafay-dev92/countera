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
      <div className="flex items-center mb-2">
        <Typography variant="h5" color="blue-gray" className="flex items-center">
          <Cog8ToothIcon className='h-12 w-12 text-blueGray-500 ml-2' />
          Settings
        </Typography>
      </div>
      {Object.keys(state.userInfo).length !== 0 && (state.userInfo.Permission?.includes("setting:view") ? (
        <div className="mt-5">
          {/* Mobile Dropdown - visible on small screens */}
          <div className="block lg:hidden mb-4">
            <div className="relative bg-white rounded-md shadow-md">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 text-left flex items-center justify-between bg-white rounded-md border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <span className="font-medium text-gray-700">{sections[activeSection].title}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  <ul className="py-1">
                    {Object.keys(sections).map((section) => (
                      <li key={section}>
                        <button
                          onClick={() => handleSectionClick(section)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${activeSection === section ? "bg-gray-300 text-gray-800 font-medium" : "text-gray-700"
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
            <div className="bg-white px-4 py-2 rounded-md shadow-md h-max w-[40%] xl:w-[30%] 2xl:w-[20%]">
              <nav>
                <ul className="space-y-1">
                  {Object.keys(sections).map((section) => (
                    <li key={section}>
                      <button
                        onClick={() => handleSectionClick(section)}
                        className={`w-full px-4 py-2 text-left rounded-md font-semibold text-xs xl:text-sm 2xl:text-base whitespace-nowrap transition-colors duration-200 ${activeSection === section
                          ? "bg-gray-200 text-gray-800"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
            <div className="bg-white p-4 rounded-md shadow-md flex-grow">
              <div className="overflow-y-auto h-[70vh]">{sections[activeSection].component}</div>
            </div>
          </div>

          {/* Mobile Content Area - full width on small screens */}
          <div className="block lg:hidden">
            <div className="bg-white p-4 rounded-md shadow-md">
              <div className="overflow-y-auto max-h-[60vh]">{sections[activeSection].component}</div>
            </div>
          </div>
        </div>
      ) :
        <div className="text-red-500 text-center mt-10">
          <Typography variant="h6">You do not have permission to view this page.</Typography>
        </div>
      )}
    </div>
  );
};

export default Settings;
