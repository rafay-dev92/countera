import React, { useState, useEffect } from "react";
import Sidebar from "./components/sidebar";
import Header from "./components/header";
import Dashboard from "./components/dashboard";
import { State } from "@/state/Context";
import { Route, Routes, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getUserDetails } from "@/services/getUserDetails";
import { Spinner } from "@material-tailwind/react";
import {
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import Businesses from "./components/businesses";
import Users from "./components/users";
import Permissions from "./components/permissions";

function AdminPanel() {
  const { dispatch } = State();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const icon = {
    className: "w-5 h-5 text-inherit",
  };
  
  const routes = [
    {
      layout: "super-admin",
      pages: [
        {
          icon: <HomeIcon {...icon} />,
          name: "dashboard",
          path: "/dashboard",
          element: <Dashboard />,
        },
        {
          icon: <BriefcaseIcon {...icon} />,
          name: "Businesses",
          path: "/businesses",
          element: <Businesses />,
        },
        {
          icon: <UserGroupIcon {...icon} />,
          name: "Users",
          path: "/users",
          element: <Users />,
        },
        {
          icon: <ShieldCheckIcon {...icon} />,
          name: "Permissions",
          path: "/permissions",
          element: <Permissions />,
        },
      ],
      
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 1500);
  }, [])

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("Token"));
        if (!token) {
          console.log("No token found");
          return;
        }

        const user = await getUserInfo(token);
        if (user?.role !== "SUPER_ADMIN") {
          navigate("/dashboard/home");
        }
      } catch (error) {
        console.log("Error in useEffect:", error);
      }
    };
    checkUserRole();
  }, []);

  const getUserInfo = async (token) => {
      try {
        const UserInfo = await (await getUserDetails(token)).json();
        return UserInfo;
      } catch (error) {
        console.log(error)
      }
  }
  
  useEffect(() => {    
    const setImpProp = async () => {
      const token = JSON.parse(localStorage.getItem('Token'));
      if (token) {
        dispatch({ type: 'SET_TOKEN', payload: token });
        try {
          const UserInfo = await getUserDetails(token);
          if (UserInfo.status >= 200 && UserInfo.status <= 299) {
            const user = await UserInfo.json();
            dispatch({ type: 'SET_USER', payload: user });
            localStorage.setItem('User', JSON.stringify(user));
          }
          else {
            try {
              const user = JSON.parse(localStorage.getItem('User'));
              if (user !== null && business !== null) {
                dispatch({ type: 'SET_USER', payload: user });
                dispatch({ type: 'SET_TOKEN', payload: token });
              }
            } catch (error) {
              console.log(error)
            }
          }
        } catch (error) {
          toast.error("Something went wrong")
        }
      }
      if (!token) navigate('/auth/sign-in')
    }
    setImpProp();
  }, [])

  useEffect(() => {
    setInterval(() => {
      const sessionExp = JSON.parse(localStorage.getItem('sessionExp'));
      if (Date.now() > sessionExp) {
        localStorage.removeItem('Token');
        localStorage.removeItem('sessionExp');
        localStorage.removeItem('User');
        localStorage.removeItem('Business');
        dispatch({ type: 'RESET' });
        navigate('/auth/sign-in');
      }
    }, 1000)
  }, [])

  if (loading) {
    return <Spinner className="mx-auto mt-[40vh] h-10 w-10 text-gray-900/50" />
  }
  return (
    <>
    <Header />
    <div className="min-h-screen">
      <Sidebar routes={routes} />
      <div className="flex flex-col flex-1">        
        <div className="py-2 xl:ml-72">
            <Routes>
              {routes.map(
                ({ layout, pages }) =>
                  layout === "super-admin" &&
                  pages.map(({ path, element }) => (
                    <Route exact path={path} element={element} />
                  ))
              )}
            </Routes>
          </div>
      </div>
    </div>
    </>
  );
}

export default AdminPanel;
