import {
  Input,
  Button,
} from "@material-tailwind/react";
import { Link } from "react-router-dom";

const FIELDS = [
  { label: "First name", placeholder: "John", type: "text" },
  { label: "Last name", placeholder: "Doe", type: "text" },
  { label: "Email", placeholder: "name@mail.com", type: "email" },
  { label: "Password", placeholder: "••••••••", type: "password" },
  { label: "Confirm password", placeholder: "••••••••", type: "password" },
];

export function SignUp() {
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
        <h1 className="mb-6 text-base font-semibold text-slate-900">Create your account</h1>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-5">
            {FIELDS.map(({ label, placeholder, type }) => (
              <div key={label}>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  {label}
                </label>
                <Input
                  size="lg"
                  type={type}
                  color="teal"
                  label={placeholder}
                  labelProps={{ className: "peer-focus:hidden peer-placeholder-shown:hidden hidden" }}
                  className="!border !border-slate-300 bg-white placeholder:text-slate-400 focus:!border-teal-600 focus:!border-t-teal-600 !border-t-slate-300"
                  placeholder={placeholder}
                  crossOrigin={undefined}
                />
              </div>
            ))}
          </div>
          <Button
            fullWidth
            className="mt-6 bg-teal-700 py-2.5 text-sm font-medium normal-case shadow-none hover:bg-teal-800 hover:shadow-none"
          >
            Create account
          </Button>
          <p className="mt-5 text-center text-[13px] text-slate-500">
            Already have an account?
            <Link to="/auth/sign-in" className="ml-1 font-medium text-teal-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>

      <p className="mt-7 text-xs text-slate-400">© {new Date().getFullYear()} Countera</p>
    </section>
  );
}

export default SignUp;
