import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { BoltIcon, BoxCubeIcon, BoxIconLine, CheckCircleIcon, ChevronDownIcon, DocsIcon, FolderIcon, GridIcon, HorizontaLDots, PieChartIcon, PlugInIcon, TaskIcon, UserCircleIcon, CircleDotIcon, } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { hasPermission } from "../auth/auth";
import { getPagePermissions } from "../auth/pagePermissions";
const navItems = [
    { name: "Dashboard", path: "/", icon: <GridIcon /> },
    {
        name: "Production Management",
        icon: <TaskIcon />,
        children: [
            { name: "Production Dashboard", path: "/production-management/dashboard" },
            { name: "Production Planning", path: "/production-management/planning" },
            {
                name: "Production Orders",
                children: [
                    { name: "Production Order List", path: "/production-management/production-orders/list" },
                    { name: "Production Order Detail", path: "/production-management/production-orders/detail" },
                ],
            },
            {
                name: "Work Orders",
                children: [
                    { name: "Work Order Management", path: "/production-management/work-orders/management" },
                    { name: "Production Execution", path: "/production-management/work-orders/execution" },
                ],
            },
            { name: "Production Results", path: "/production-management/results" },
        ],
    },
    {
        name: "Machine & Equipment",
        icon: <BoxCubeIcon />,
        children: [
            { name: "Machine Monitoring", path: "/machine-equipment/machine-monitoring" },
            { name: "Machine Detail", path: "/machine-equipment/machine-detail" },
            { name: "Equipment Monitoring", path: "/machine-equipment/equipment-monitoring" },
            { name: "Downtime Management", path: "/machine-equipment/downtime-management" },
            { name: "Alarm History", path: "/machine-equipment/alarm-history" },
        ],
    },
    {
        name: "Mold Management",
        icon: <BoxIconLine />,
        children: [
            { name: "Mold Overview", path: "/mold-management/overview" },
            { name: "Mold List", path: "/mold-management/list" },
            { name: "Mold Detail", path: "/mold-management/detail" },
            { name: "Mold Status", path: "/mold-management/status" },
            { name: "Mold Installation History", path: "/mold-management/installation-history" },
            { name: "Mold Shot Counter", path: "/mold-management/shot-counter" },
            { name: "Mold Location", path: "/mold-management/location" },
        ],
    },
    {
        name: "Material Management",
        icon: <FolderIcon />,
        children: [
            { name: "Material Status", path: "/material-management/status" },
            { name: "Material Requirement", path: "/material-management/requirement" },
            { name: "Material Allocation", path: "/material-management/allocation" },
            { name: "Material Usage", path: "/material-management/usage" },
            { name: "Material Lot History", path: "/material-management/lot-history" },
        ],
    },
    {
        name: "Quality Management",
        icon: <CheckCircleIcon />,
        children: [
            { name: "Quality Dashboard", path: "/quality-management/dashboard" },
            { name: "Inspection Management", path: "/quality-management/inspection-management" },
            { name: "SPC Monitoring", path: "/quality-management/spc-monitoring" },
            { name: "NG Management", path: "/quality-management/ng-management" },
            { name: "Measuring Equipment", path: "/quality-management/measuring-equipment" },
            { name: "Calibration Management", path: "/quality-management/calibration-management" },
        ],
    },
    {
        name: "Maintenance Management",
        icon: <BoltIcon />,
        children: [
            { name: "Maintenance Overview", path: "/maintenance-management/overview" },
            { name: "Maintenance Requests", path: "/maintenance-management/requests" },
            { name: "Maintenance Planning", path: "/maintenance-management/planning" },
            { name: "Machine & Equipment Maintenance", path: "/maintenance-management/machine-equipment-maintenance" },
            { name: "Mold Maintenance", path: "/maintenance-management/mold-maintenance" },
            { name: "Production Tool Maintenance", path: "/maintenance-management/production-tool-maintenance" },
            { name: "Maintenance History", path: "/maintenance-management/history" },
        ],
    },
    {
        name: "Traceability",
        icon: <DocsIcon />,
        children: [
            { name: "Product Traceability", path: "/traceability/product" },
            { name: "Material Traceability", path: "/traceability/material" },
            { name: "Lot Genealogy", path: "/traceability/lot-genealogy" },
        ],
    },
    {
        name: "Reports & Analytics",
        icon: <PieChartIcon />,
        children: [{ name: "Report Center", path: "/reports-analytics/report-center" }],
    },
    {
        name: "Administration",
        icon: <UserCircleIcon />,
        children: [
            { name: "User Management", path: "/administration/user-management" },
            { name: "Role & Permission", path: "/administration/role-permission" },
            { name: "Audit Log", path: "/administration/audit-log" },
        ],
    },
    {
        name: "System Configuration",
        icon: <PlugInIcon />,
        children: [
            {
                name: "Master Data",
                children: [
                    { name: "Factory Structure Master", path: "/system-configuration/master-data/factory-structure" },
                    { name: "Product Master", path: "/system-configuration/master-data/product" },
                    { name: "Machine & Equipment Master", path: "/system-configuration/master-data/machine-equipment" },
                    { name: "Mold Master", path: "/system-configuration/master-data/mold" },
                    { name: "Material Master", path: "/system-configuration/master-data/material" },
                    { name: "Production Tool Master", path: "/system-configuration/master-data/production-tool" },
                    { name: "Measuring Equipment Master", path: "/system-configuration/master-data/measuring-equipment" },
                    { name: "Quality Standard Master", path: "/system-configuration/master-data/quality-standard" },
                    { name: "Process Parameter Standard", path: "/system-configuration/master-data/process-parameter-standard" },
                    { name: "Shift & Calendar Master", path: "/system-configuration/master-data/shift-calendar" },
                    { name: "Reason Code Master", path: "/system-configuration/master-data/reason-code" },
                ],
            },
            {
                name: "IoT Configuration",
                children: [
                    { name: "IoT Data Dictionary", path: "/system-configuration/iot/data-dictionary" },
                    { name: "Device Mapping", path: "/system-configuration/iot/device-mapping" },
                    { name: "Data Collection Status", path: "/system-configuration/iot/data-collection-status" },
                ],
            },
            { name: "Integration Settings", path: "/system-configuration/integration-settings" },
            { name: "System Settings", path: "/system-configuration/system-settings" },
        ],
    },
];
function itemKey(parentKey, index, name) {
    return `${parentKey}/${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
function containsActivePath(item, pathname) {
    if (item.path)
        return item.path === pathname;
    return item.children?.some((child) => containsActivePath(child, pathname)) ?? false;
}
function collectActiveAncestorKeys(items, pathname, parentKey = "root") {
    const keys = [];
    items.forEach((item, index) => {
        const key = itemKey(parentKey, index, item.name);
        if (item.children && containsActivePath(item, pathname)) {
            keys.push(key);
            keys.push(...collectActiveAncestorKeys(item.children, pathname, key));
        }
    });
    return keys;
}
function filterItemsByViewPermission(items) {
    return items.reduce((visibleItems, item) => {
        if (item.path) {
            const permissions = getPagePermissions(item.path);
            if (!permissions || hasPermission(permissions.view)) visibleItems.push(item);
            return visibleItems;
        }
        const children = filterItemsByViewPermission(item.children || []);
        if (children.length) visibleItems.push({ ...item, children });
        return visibleItems;
    }, []);
}
const AppSidebar = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const visibleNavItems = useMemo(() => filterItemsByViewPermission(navItems), []);
    const activeAncestorKeys = useMemo(() => collectActiveAncestorKeys(visibleNavItems, location.pathname), [visibleNavItems, location.pathname]);
    useEffect(() => {
        const next = {};
        activeAncestorKeys.forEach((key) => {
            next[key] = true;
        });
        setOpenMenus(next);
    }, [activeAncestorKeys]);
    const toggleMenu = (key) => {
        setOpenMenus((previous) => ({
            ...previous,
            [key]: !previous[key],
        }));
    };
    const isActive = (path) => path === location.pathname;
    const showLabels = isExpanded || isHovered || isMobileOpen;
    const renderItems = (items, depth = 0, parentKey = "root") => (<ul className={depth === 0 ? "flex flex-col gap-1.5" : "space-y-0.5"}>
      {items.map((item, index) => {
            const key = itemKey(parentKey, index, item.name);
            const hasChildren = Boolean(item.children?.length);
            const isOpen = Boolean(openMenus[key]);
            const branchActive = containsActivePath(item, location.pathname);
            if (!hasChildren && item.path) {
                return (<li key={key}>
              <Link to={item.path} className={depth === 0
                        ? `menu-item group ${isActive(item.path) ? "menu-item-active" : "menu-item-inactive"} ${!showLabels ? "lg:justify-center" : "lg:justify-start"}`
                        : `menu-dropdown-item ${isActive(item.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"}`} style={depth > 1
                        ? { paddingLeft: `${10 + (depth - 1) * 11}px` }
                        : undefined}>
                {depth === 0 && item.icon && (<span className={`menu-item-icon-size ${isActive(item.path)
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive"}`}>
                    {item.icon}
                  </span>)}
                {showLabels && (<>
                    {depth > 0 && (<CircleDotIcon className="h-3.5 w-3.5 shrink-0 text-current"/>)}
                    <span className="min-w-0 flex-1 text-left">{item.name}</span>
                  </>)}
              </Link>
            </li>);
            }
            return (<li key={key}>
            <button type="button" onClick={() => toggleMenu(key)} className={depth === 0
                    ? `menu-item group ${branchActive ? "menu-item-active" : "menu-item-inactive"} ${!showLabels ? "lg:justify-center" : "lg:justify-start"}`
                    : `menu-dropdown-item w-full ${branchActive
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"}`} style={depth > 1
                    ? { paddingLeft: `${10 + (depth - 1) * 11}px` }
                    : undefined}>
              {depth === 0 && item.icon && (<span className={`menu-item-icon-size ${branchActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {item.icon}
                </span>)}
              {showLabels && (<>
                  {depth > 0 && (<CircleDotIcon className="h-3.5 w-3.5 shrink-0 text-current"/>)}
                  <span className="min-w-0 flex-1 text-left">{item.name}</span>
                  <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}/>
                </>)}
            </button>

            {showLabels && item.children && (<div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className={depth === 0
                        ? "ml-7 mt-0.5"
                        : "ml-2.5 mt-0.5 border-l border-gray-800 pl-1.5"}>
                    {renderItems(item.children, depth + 1, key)}
                  </div>
                </div>
              </div>)}
          </li>);
        })}
    </ul>);
    return (<aside className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-800 bg-gray-900 px-4 text-gray-100 transition-all duration-300 ease-in-out lg:mt-0 ${isExpanded || isMobileOpen
            ? "w-[252px]"
            : isHovered
                ? "w-[252px]"
                : "w-[72px]"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`} onMouseEnter={() => !isExpanded && setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className={`flex py-5 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          <img src="/images/logo/logo-dark.png" alt="Logo" width={showLabels ? 220 : 46} height={showLabels ? 60 : 46}/>
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto pb-16 duration-300 ease-linear no-scrollbar">
        <nav className="mb-4">
          <h2 className={`mb-2.5 flex text-[10px] uppercase leading-4 text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
            {showLabels ? "Menu" : <HorizontaLDots className="size-5"/>}
          </h2>
          {renderItems(visibleNavItems)}
        </nav>
      </div>
    </aside>);
};
export default AppSidebar;
