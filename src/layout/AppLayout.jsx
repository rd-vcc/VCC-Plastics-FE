import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
const LayoutContent = () => {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div className={`min-h-screen flex-1 bg-gray-50 transition-all duration-300 ease-in-out dark:bg-gray-950 ${isExpanded || isHovered ? "lg:ml-[252px]" : "lg:ml-[72px]"} ${isMobileOpen ? "ml-0" : ""}`}>
        <AppHeader />
        <main className="w-full px-1.5 py-1.5 sm:px-2 sm:py-2">
          <Outlet />
        </main>
      </div>
    </div>);
};
const AppLayout = () => {
    return (<SidebarProvider>
      <LayoutContent />
    </SidebarProvider>);
};
export default AppLayout;
