import { useState } from "react";
import { useNavigate } from "react-router";
import { AccountCircle, ArrowDropDown, Logout, } from "@mui/icons-material";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { getCurrentUser, logout, } from "../../auth/auth";
export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const user = getCurrentUser();
    const fullName = user?.full_name || "Người dùng";
    const employeeCode = user?.employee_code || "";
    const position = user?.position || "";
    function toggleDropdown() {
        setIsOpen((value) => !value);
    }
    function closeDropdown() {
        setIsOpen(false);
    }
    function handleSignOut() {
        logout();
        closeDropdown();
        navigate("/login", {
            replace: true,
        });
    }
    return (<div className="relative">
      {/* USER BUTTON TRÊN HEADER */}
      <button type="button" onClick={toggleDropdown} className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400">
        {/* USER ICON */}
        <span className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <AccountCircle sx={{
            fontSize: 27,
        }}/>
        </span>

        {/* USER NAME */}
        <span className="mr-1 block max-w-[180px] truncate font-medium text-theme-sm">
          {fullName}
        </span>

        {/* DROPDOWN ARROW */}
        <ArrowDropDown sx={{
            fontSize: 24,
        }} className={`ml-1 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`}/>
      </button>

      {/* DROPDOWN */}
      <Dropdown isOpen={isOpen} onClose={closeDropdown} className="absolute right-0 mt-[17px] flex w-[280px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">

        {/* MENU */}
        <ul className="flex flex-col gap-1 border-b border-gray-200 pb-3 pt-4 dark:border-gray-800">
          {/* PROFILE */}
          <li>
            <DropdownItem onItemClick={closeDropdown} tag="a" to="/profile" className="group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
              <AccountCircle sx={{
            fontSize: 22,
        }} className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"/>

              Thông tin nhân viên
            </DropdownItem>
          </li>

          {/* ACCOUNT SETTINGS */}
          {/* <li>
          <DropdownItem
            onItemClick={closeDropdown}
            tag="a"
            to="/account-settings"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <Settings
              sx={{
                fontSize: 22,
              }}
              className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
            />

            Cài đặt tài khoản
          </DropdownItem>
        </li> */}

          {/* SUPPORT */}
          {/* <li>
          <DropdownItem
            onItemClick={closeDropdown}
            tag="a"
            to="/support"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <Help
              sx={{
                fontSize: 22,
              }}
              className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
            />

            Hỗ trợ
          </DropdownItem>
        </li> */}
        </ul>

        {/* LOGOUT */}
        <button type="button" onClick={handleSignOut} className="group mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
          <Logout sx={{
            fontSize: 22,
        }} className="text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"/>

          Đăng xuất
        </button>
      </Dropdown>
    </div>);
}
