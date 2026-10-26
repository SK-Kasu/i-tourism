import { Link } from "react-router-dom";
import Card from "../ui/Card.jsx";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <Link to="/" className="text-heading-lg text-primary-600 mb-6">
        I-Tourism
      </Link>
      <Card className="w-full max-w-md p-6">
        <h1 className="text-heading-lg text-ink-900">{title}</h1>
        {subtitle && <p className="text-body text-ink-600 mt-1 mb-5">{subtitle}</p>}
        {children}
      </Card>
      {footer && <p className="text-body text-ink-600 mt-4">{footer}</p>}
    </div>
  );
}
