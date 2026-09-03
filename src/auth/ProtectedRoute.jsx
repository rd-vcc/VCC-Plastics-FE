import { Navigate, Outlet, useLocation } from "react-router";
import { isAuthenticated } from "./auth";
export default function ProtectedRoute() {
    const location = useLocation();
    if (!isAuthenticated()) {
        return (<Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }}/>);
    }
    return <Outlet />;
}
