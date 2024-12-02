import React from "react";
import {
  MdDashboard,
  MdOutlineAddTask,
  MdOutlinePendingActions,
  MdSettings,
  MdTaskAlt,
} from "react-icons/md";
import { FaTasks, FaTrashAlt, FaUsers } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { setOpenSidebar } from "../redux/slices/authSlice";
import clsx from "clsx";

const linkData = [
  {
    label: "Dashboard",
    link: "dashboard",
    icon: <MdDashboard />,
  },
  {
    label: "Tasks",
    link: "tasks",
    icon: <FaTasks />,
  },
  {
    label: "Completed",
    link: "completed/completed",
    icon: <MdTaskAlt />,
  },
  {
    label: "In Progress",
    link: "in-progress/in progress",
    icon: <MdOutlinePendingActions />,
  },
  {
    label: "To Do",
    link: "todo/todo",
    icon: <MdOutlinePendingActions />,
  },
  {
    label: "Team",
    link: "team",
    icon: <FaUsers />,
  },
  {
    label: "Trash",
    link: "trashed",
    icon: <FaTrashAlt />,
  },
];

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const path = location.pathname.split("/")[1];
  const sidebarLinks = user?.isAdmin ? linkData : linkData.slice(0, 5);

  const closeSidebar = () => {
    dispatch(setOpenSidebar(false));
  };
  const NavLink = ({ el }) => {
    const isActive = path === el.link.split("/")[0];
  
    return (
      <Link
        to={el.link}
        onClick={closeSidebar}
        className={clsx(
          "group relative flex items-center w-full gap-3 px-4 py-3",
          "rounded-xl transition-all duration-300 ease-in-out",
          isActive ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-200" : "hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-400",
        )}
      >
        {/* Active Indicator */}
        <div
          className={clsx(
            "absolute left-0 w-1 h-6 rounded-r-full transition-all duration-300",
            isActive ? "bg-white" : "bg-transparent group-hover:bg-blue-300"
          )}
        />
        
        {/* Icon */}
        <div className={clsx(
          "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
          isActive ? "text-white" : "text-gray-400 group-hover:text-white bg-gray-50 group-hover:bg-blue-600 group-hover:shadow-md"
        )}>
          {el.icon}
        </div>
        
        {/* Label */}
        <span className={clsx(
          "font-medium transition-all duration-300",
          isActive ? "text-white" : "text-gray-600 group-hover:text-white"
        )}>
          {el.label}
        </span>
  
        {/* Hover Glow Effect */}
        <div className={clsx(
          "absolute inset-0 rounded-xl transition-opacity duration-300",
          "opacity-0 group-hover:opacity-100",
          "bg-gradient-to-r from-blue-100/50 to-transparent",
          "pointer-events-none"
        )} />
      </Link>
    );
  };
  

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo Section with gradient border */}
      <div className="relative p-6 after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gray-200 after:to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-xl blur-lg opacity-50" />
            <div className="relative bg-gradient-to-tr from-blue-600 to-blue-500 p-2.5 rounded-xl">
              <MdOutlineAddTask className="text-white text-2xl" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          WorkStream
          </span>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-200">
        {sidebarLinks.map((link) => (
          <NavLink key={link.label} el={link} />
        ))}
      </nav>

      {/* Settings Section with gradient border */}
      <div className="relative px-3 py-4 before:absolute before:top-0 before:left-4 before:right-4 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 before:to-transparent">
        <button className={clsx(
          "group relative flex items-center w-full gap-3 px-4 py-3",
          "rounded-xl transition-all duration-300",
          "hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent"
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-gray-50 group-hover:bg-white group-hover:text-gray-600 group-hover:shadow-md transition-all duration-300">
            <MdSettings className="text-xl" />
          </div>
          <span className="font-medium text-gray-600 group-hover:text-gray-900 transition-all duration-300">
            Settings
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;