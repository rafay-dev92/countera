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
import { fetchBusinessesForEmail } from "@/services/fetchBusinessesForEmail";
import { UserRole } from "@countera/shared";
import ReCAPTCHA from "react-google-recaptcha";

export function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [step, setStep] = useState(1);
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const [captchaValue, setCaptchaValue] = useState(null);

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
        if (user?.role === UserRole.SUPER_ADMIN) {
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
    if (!email) {
      showToastMessage("info", "Email is required.");
      return;
    }
    if (!captchaValue) {
      showToastMessage("info", "Please complete the CAPTCHA.");
      return;
    }
    setLoading(true);
    setBusinesses([]);
    setSelectedBusiness(null);
    try {
      const res = await fetchBusinessesForEmail(email, captchaValue);
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setBusinesses(data.businesses);
        if (data.isSuperAdmin || data.businesses.length === 1) {
          setStep(3);
          if (data.businesses?.length === 1) setSelectedBusiness(data.businesses[0].id)
        } else if (data.businesses.length > 1) {
          setStep(2);
        } else {
          showToastMessage('info', data.message || 'No businesses found for this email');
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

  const handleBack = () => {
    if (step === 3) {
      if (!businesses || businesses.length === 1) {
        setStep(1);
      } else {
        setStep(2);
      }
    } else {
      setStep((prev) => Math.max(1, prev - 1));
    }
  };

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
        if (user.refreshToken) {
          localStorage.setItem('RefreshToken', JSON.stringify(user.refreshToken));
        }
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
    return <Spinner className="mx-auto mt-[40vh] h-10 w-10 text-slate-400" />
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-lg font-bold text-white">
          C
        </span>
        <span className="text-xl font-semibold tracking-tight text-slate-900">Countera</span>
      </div>
      <p className="mb-7 text-sm text-slate-500">Business finances, in one place.</p>

      <div className="w-full max-w-[400px] rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
        <h1 className="mb-1 text-base font-semibold text-slate-900">Sign in to your business</h1>
        <p className="mb-6 text-[13px] text-slate-500">
          {step === 1 && "Enter your email to continue."}
          {step === 2 && "Select your business."}
          {step === 3 && "Enter your password."}
        </p>

        <form onKeyDown={handleKeyDown} onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-5">
            {step === 1 && (
              <>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                    Email
                  </label>
                  <Input
                    size="lg"
                    color="teal"
                    label="name@mail.com"
                    labelProps={{ className: "peer-focus:hidden peer-placeholder-shown:hidden hidden" }}
                    className="!border !border-slate-300 bg-white placeholder:text-slate-400 focus:!border-teal-600 focus:!border-t-teal-600 !border-t-slate-300"
                    placeholder="name@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(value) => setCaptchaValue(value)}
                />
                <Button
                  onClick={handleCheckEmail}
                  fullWidth
                  className="bg-teal-700 py-2.5 text-sm font-medium normal-case shadow-none hover:bg-teal-800 hover:shadow-none"
                >
                  Continue
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <div className="flex flex-col gap-2">
                  {businesses.map((b) => (
                    <label
                      key={b.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                        selectedBusiness === b.id
                          ? "border-teal-600 bg-teal-50/60"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Radio
                        name="business"
                        color="teal"
                        checked={selectedBusiness === b.id}
                        onChange={() => handleBusinessSelect(b.id)}
                      />
                      <span className="text-sm font-medium text-slate-900">{b.name}</span>
                      <span className="text-xs text-slate-500">{b.email}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    fullWidth
                    className="border-slate-300 py-2.5 text-sm font-medium normal-case text-slate-700"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNextAfterBusiness}
                    fullWidth
                    className="bg-teal-700 py-2.5 text-sm font-medium normal-case shadow-none hover:bg-teal-800 hover:shadow-none"
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-[13px] font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-medium text-teal-700 hover:underline"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    size="lg"
                    color="teal"
                    label="Password"
                    labelProps={{ className: "peer-focus:hidden peer-placeholder-shown:hidden hidden" }}
                    className="!border !border-slate-300 bg-white placeholder:text-slate-400 focus:!border-teal-600 focus:!border-t-teal-600 !border-t-slate-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    inputRef={passwordInputRef}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    fullWidth
                    className="border-slate-300 py-2.5 text-sm font-medium normal-case text-slate-700"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSignIn}
                    fullWidth
                    disabled={!password}
                    className="bg-teal-700 py-2.5 text-sm font-medium normal-case shadow-none hover:bg-teal-800 hover:shadow-none"
                  >
                    Sign in
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>

      <p className="mt-7 text-xs text-slate-400">© {new Date().getFullYear()} Countera</p>
    </section>
  );
}

export default SignIn;
