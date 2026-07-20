import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Sidenav,
  DashboardNavbar,
} from "@/widgets/layout";
import { Spinner } from "@material-tailwind/react";
import routes from "@/routes";
import { State } from "@/state/Context";
import { getUserDetails } from "@/services/getUserDetails";
import { refreshToken } from "@/services/refreshToken";
import { toast } from "react-toastify";
import { logout as logoutUtil } from "@/utils/logout";
import type { ApiUser, Business, SessionUser } from "@/types/api";

/** JSON.parse(null) yields null, matching the template's original behavior. */
const readJSON = <T,>(key: string): T | null =>
  JSON.parse(localStorage.getItem(key) as string) as T | null;

export function Dashboard() {
  const { dispatch } = State();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setImpProp = async () => {
      const token = readJSON<string>('Token');
      if (token) {
        dispatch({ type: 'SET_TOKEN', payload: token });
        try {
          const UserInfo = (await getUserDetails(token))!;
          if (UserInfo.status >= 200 && UserInfo.status <= 299) {
            const apiUser: ApiUser = await UserInfo.json();
            const permissions = (apiUser.Permission ?? []).map((perm) => perm.name);
            const user: SessionUser = { ...apiUser, Permission: permissions };
            if (user.role === 'SUPER_ADMIN') {
              navigate("/super-admin/dashboard");
              dispatch({ type: 'SET_USER', payload: user });
              localStorage.setItem('User', JSON.stringify(user));
              dispatch({ type: 'SET_BUSINESS', payload: null });
              localStorage.removeItem('Business');
            } else {
              dispatch({ type: 'SET_USER', payload: user });
              localStorage.setItem('User', JSON.stringify(user));
              if (user.Business) {
                const business = user.Business;
                dispatch({ type: 'SET_BUSINESS', payload: business });
                localStorage.setItem('Business', JSON.stringify(business));
              } else {
                dispatch({ type: 'SET_BUSINESS', payload: null });
                localStorage.removeItem('Business');
              }
            }
          }
          else {
            try {
              const user = readJSON<SessionUser>('User');
              const business = readJSON<Business>('Business');
              if (user?.role === 'SUPER_ADMIN') {
                navigate("/super-admin/dashboard");
              }
              if (user !== null && business !== null) {
                dispatch({ type: 'SET_USER', payload: user });
                dispatch({ type: 'SET_BUSINESS', payload: business });
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
    // Refresh token every 5 minutes
    const refreshTokenInterval = setInterval(async () => {
      try {
        const token = readJSON<string>('Token');
        const refreshTokenValue = readJSON<string>('RefreshToken');

        if (!token || !refreshTokenValue) {
          return;
        }

        const response = (await refreshToken(token, refreshTokenValue))!;

        if (response.ok) {
          const data = await response.json();

          // Update token and refreshToken in localStorage
          localStorage.setItem('Token', JSON.stringify(data.token));
          if (data.refreshToken) {
            localStorage.setItem('RefreshToken', JSON.stringify(data.refreshToken));
          }
          localStorage.setItem('sessionExp', JSON.stringify(data.sessionExpire));

          // Update token in state
          dispatch({ type: 'SET_TOKEN', payload: data.token });
        } else {
          // If refresh fails, log out
          const errorData = await response.json();
          console.error('Token refresh failed:', errorData.message);
          logoutUtil(dispatch, navigate);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        // On error, log out
        logoutUtil(dispatch, navigate);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup intervals on unmount
    return () => {
      clearInterval(refreshTokenInterval);
    };
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 1000);
  }, [])

  if (loading) {
    return <Spinner className="mx-auto mt-[40vh] h-10 w-10 text-slate-400" />
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidenav routes={routes} />
      <div className="xl:ml-72">
        <DashboardNavbar />
        <main className="mx-auto max-w-[1440px] p-4 md:p-6">
          <Routes>
            {routes.map(
              ({ layout, pages }) =>
                layout === "dashboard" &&
                pages.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layouts/dashboard.tsx";

export default Dashboard;
