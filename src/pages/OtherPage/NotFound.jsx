import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
export default function NotFound() {
    return (<div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
      <PageMeta title="Page Not Found | VCC Plastics" description="Page not found"/>
      <div className="text-center">
        <p className="text-sm font-semibold text-brand-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">The requested page does not exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          Back to Dashboard
        </Link>
      </div>
    </div>);
}
