import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { loginSchema } from "../../lib/validators.js";
import { homeForRole } from "../../lib/utils.js";

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  if (!isLoading && user) return <Navigate to={homeForRole(user.role)} replace />;

  async function onSubmit(values) {
    try {
      const loggedIn = await login(values.phoneNumber, values.password);
      toast.success(`Welcome back, ${loggedIn.fullName.split(" ")[0]}`);
      navigate(homeForRole(loggedIn.role), { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not log in");
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Use the phone number you registered with."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-primary-600 font-medium">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
