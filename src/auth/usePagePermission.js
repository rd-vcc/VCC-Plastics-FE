import { useLocation } from "react-router";
import { hasPermission } from "./auth";
import { getPagePermissions } from "./pagePermissions";

export default function usePagePermission() {
  const { pathname } = useLocation();
  const permissions = getPagePermissions(pathname);

  return {
    permissions,
    canView: !permissions || hasPermission(permissions.view),
    canEdit: !permissions || hasPermission(permissions.edit),
  };
}
