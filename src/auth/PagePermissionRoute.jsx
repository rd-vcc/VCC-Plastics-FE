import { Navigate, Outlet, useLocation } from "react-router";
import { hasPermission } from "./auth";
import { getPagePermissions } from "./pagePermissions";

export default function PagePermissionRoute({ children }) {
  const location = useLocation();
  const pagePermissions = getPagePermissions(location.pathname);

  if (!pagePermissions || hasPermission(pagePermissions.view)) {
    return children || <Outlet />;
  }

  return <Navigate to="/403" replace state={{ from: location.pathname }} />;
}
