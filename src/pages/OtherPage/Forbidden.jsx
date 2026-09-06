import { Link } from "react-router";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="text-7xl font-bold text-brand-500">403</div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Access denied</h1>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
        You do not have View permission for this page. Contact the system administrator if you need access.
      </p>
      <Link className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600" to="/profile">
        Back to Profile
      </Link>
    </div>
  );
}
