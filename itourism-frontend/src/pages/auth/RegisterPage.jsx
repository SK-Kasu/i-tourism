import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import clsx from "clsx";
import toast from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { api } from "../../lib/api.js";
import { registerSchema } from "../../lib/validators.js";
import { homeForRole } from "../../lib/utils.js";

const ROLES = [
  { value: "TRAVELER", label: "I'm a traveler", hint: "Search and book stays" },
  { value: "OWNER", label: "I own a property", hint: "List rooms, get paid" },
];

export default function RegisterPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "TRAVELER" },
  });
  const role = watch("role");

  if (!isLoading && user) return <Navigate to={homeForRole(user.role)} replace />;

  async function onSubmit(values) {
    try {
      await api.post("/auth/register", {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        email: values.email || undefined,
        password: values.password,
        role: values.role,
      });
      // Log in straight away so the user doesn't have to type it all again.
      const loggedIn = await login(values.phoneNumber, values.password);
      toast.success("Account created. Welcome to I-Tourism!");
      navigate(homeForRole(loggedIn.role), { replace: true });
    } catch (err) {
      if (err.code === "PHONE_TAKEN") {
        setError("phoneNumber", { message: "This phone number is already registered" });
      } else {
        toast.error(err.message || "Could not create account");
      }
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 font-medium">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setValue("role", r.value)}
              className={clsx(
                "text-left rounded-control border p-3 transition-colors",
                role === r.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-surface-border hover:bg-surface-muted"
              )}
            >
              <span className="block text-body font-medium text-ink-900">{r.label}</span>
              <span className="block text-xs text-ink-600">{r.hint}</span>
            </button>
          ))}
        </div>

        <Input label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <Input
          label="Phone number (M-Pesa)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
        />
        <Input
          label="Email (optional)"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
