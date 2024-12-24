import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Typography,
  Spinner,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { signIn } from "@/services/signIn";
import { toast } from 'react-toastify';
import { getUserDetails } from "@/services/getUserDetails";

export function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showToastMessage = (type, message) => {
    if (type === 'success') {
      toast.success(message)
    }
    else if (type === 'info') {
      toast.info(message)
    }
    else {
      toast.error(message)
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      setLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem("Token"));
        if (!token) {
          setLoading(false);
          return;
        }

        const user = await getUserInfo(token);
        setLoading(false);
        if (user?.role === "super-admin") {
          navigate("/super-admin/dashboard");
        } else {
          navigate("/dashboard/home");
        }
      } catch (error) {
        console.log("Error in useEffect:", error);
      }
    };

    checkUserRole();
  }, [navigate]);

  const getUserInfo = async (token) => {
    try {
      const UserInfo = await (await getUserDetails(token)).json();
      return UserInfo;
    } catch (error) {
      console.log(error)
    }
  }

  async function handleSignIn() {
    setLoading(true);
    const data = {
      email: email,
      password: password
    }
    try {
      const res = await signIn(data);
      const user = await res.json();
      if (res.ok) {
        localStorage.setItem('Token', JSON.stringify(user.token));
        localStorage.setItem('sessionExp', JSON.stringify(user.sessionExpire));
        try {
          const UserInfo = await getUserInfo(user.token);
          setEmail('');
          setPassword('');
          setShowPassword(false);
          setLoading(false);
          if (UserInfo?.role === 'super-admin') navigate('/super-admin/dashboard')
          else navigate('/dashboard/home')
        } catch (error) {
          console.log(error)
        }
      }
      else {
        setLoading(false);
        showToastMessage('info', user.message)
      }
    } catch (error) {
      console.log(error)
      setLoading(false);
      showToastMessage('error', "Something went wrong")
    }
  }

  if (loading) {
    return <Spinner className="mx-auto mt-[40vh] h-10 w-10 text-gray-900/50" />
  }
  return (
    <section className="w-full pt-24 h-screen">
      <div className="text-center">
        <Typography variant="h2" className="font-bold mb-4">Sign In</Typography>
        <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">Enter your email and password to Sign In.</Typography>
      </div>
      <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/4">
        <div className="mb-1 flex flex-col gap-6">
          <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
            Your email
          </Typography>
          <Input
            size="lg"
            placeholder="name@mail.com"
            className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
            labelProps={{
              className: "before:content-none after:content-none",
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
            Password
          </Typography>
          <div className="relative w-full">
            <Input
              type={showPassword ? "text" : "password"}
              size="lg"
              placeholder="********"
              className="!border-t-blue-gray-200 focus:!border-t-gray-900 pr-10"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "hide" : "show"}
            </span>
          </div>
        </div>

        <Button onClick={handleSignIn} className="mt-6" fullWidth>
          Sign In
        </Button>

        {/* <div className="flex items-center justify-end gap-2 mt-6">

          <Typography variant="small" className="font-medium text-gray-900">
            <a href="#">
              Forgot Password
            </a>
          </Typography>
        </div> */}
      </form>
    </section>
  );
}

export default SignIn;
