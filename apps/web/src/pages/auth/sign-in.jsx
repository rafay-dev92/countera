import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Typography,
  Spinner,
  Radio
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
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [step, setStep] = useState(1); // 1: email, 2: business, 3: password

  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (step === 3 && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [step]);

  const showToastMessage = (type, message) => {
    if (type === 'success') toast.success(message)
    else if (type === 'info') toast.info(message)
    else toast.error(message)
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
        if (user?.role === "SUPER_ADMIN") {
          navigate("/super-admin/dashboard");
        } else {
          navigate("/dashboard/home");
        }
      } catch (error) {
        setLoading(false);
      }
    };
    checkUserRole();
  }, [navigate]);

  const getUserInfo = async (token) => {
    try {
      const UserInfo = await (await getUserDetails(token)).json();
      return UserInfo;
    } catch (error) {
      return null;
    }
  }

  async function handleCheckEmail() {
    setLoading(true);
    setBusinesses([]);
    setSelectedBusiness(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/businesses-for-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setLoading(false);
      
      if (res.ok) {
        if (data.isSuperAdmin || data.businesses.length === 1) {
          setStep(3);
          if (data.businesses?.length === 1) setSelectedBusiness(data.businesses[0].id)
        } else if (data.businesses.length > 1) {
          setBusinesses(data.businesses);
          setStep(2);
        } else {
          showToastMessage('info', 'No businesses found for this email');
        }
      } else {
        showToastMessage('info', data.message || 'No businesses found for this email');
      }
    } catch (error) {
      setLoading(false);
      showToastMessage('error', 'Something went wrong');
    }
  }

  function handleBusinessSelect(businessId) {
    setSelectedBusiness(businessId);
  }

  function handleNextAfterBusiness() {
    if (selectedBusiness) setStep(3);
    else showToastMessage('info', 'Please select a business');
  }

  async function handleSignIn() {
    setLoading(true);
    const data = {
      email: email,
      password: password,
      businessId: selectedBusiness
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
          if (UserInfo?.role === 'SUPER_ADMIN' || UserInfo?.isSuperAdmin) navigate('/super-admin/dashboard')
          else navigate('/dashboard/home')
        } catch (error) {
          setLoading(false);
        }
      }
      else {
        setLoading(false);
        showToastMessage('info', user.message)
      }
    } catch (error) {
      setLoading(false);
      showToastMessage('error', "Something went wrong")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (step === 1 && email) handleCheckEmail();
      else if (step === 2 && selectedBusiness) handleNextAfterBusiness();
      else if (step === 3 && password) handleSignIn();
    }
  };

  if (loading) {
    return <Spinner className="mx-auto mt-[40vh] h-10 w-10 text-gray-900/50" />
  }

  return (
    <section className="w-full pt-24 h-screen">
      <div className="text-center">
        <Typography variant="h2" className="font-bold mb-4">Sign In</Typography>
        <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
          {step === 1 && "Enter your email to continue."}
          {step === 2 && "Select your business."}
          {step === 3 && "Enter your password."}
        </Typography>
      </div>
      <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/4" onKeyDown={handleKeyDown}>
        <div className="mb-1 flex flex-col gap-6">
          {step === 1 && (
            <>
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
              <Button onClick={handleCheckEmail} className="mt-2" fullWidth>
                Next
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
                Select a business
              </Typography>
              <div className="flex flex-col gap-2">
                {businesses.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                    <Radio
                      name="business"
                      color="blue"
                      checked={selectedBusiness === b.id}
                      onChange={() => handleBusinessSelect(b.id)}
                    />
                    <span className="font-bold">{b.name}</span>
                    <span className="text-xs text-gray-500">{b.email}</span>
                  </label>
                ))}
              </div>
              <Button onClick={handleNextAfterBusiness} className="mt-2" fullWidth>
                Next
              </Button>
            </>
          )}
          {step === 3 && (
            <>
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
                  inputRef={passwordInputRef}
                />
                <span
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "hide" : "show"}
                </span>
              </div>
              <Button onClick={handleSignIn} className="mt-6" fullWidth disabled={!password}>
                Sign In
              </Button>
            </>
          )}
        </div>
      </form>
    </section>
  );
}

export default SignIn;
