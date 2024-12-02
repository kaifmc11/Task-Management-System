import React, { useEffect } from "react";
import clsx from "clsx";
import moment from "moment";
import { FaNewspaper } from "react-icons/fa";
import { FaArrowsToDot } from "react-icons/fa6";
import { LuClipboardEdit } from "react-icons/lu";
import {
  MdAdminPanelSettings,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { useSelector } from "react-redux";
import { Chart } from "../components/Chart";
import Loading from "../components/Loader";
import UserInfo from "../components/UserInfo";
import { useGetDashboardStatsQuery } from "../redux/slices/api/taskApiSlice";
import { BGS, PRIORITYSTYLES, TASK_TYPE, getInitials } from "../utils";

const Card = ({ label, count, bg, icon }) => {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 sm:p-8">
      <div className="relative z-10 flex flex-col items-center justify-center space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h4 className="mt-2 text-2xl font-bold text-gray-900 sm:mt-3 sm:text-3xl">{count}</h4>
        </div>
        <div className={clsx(
          "rounded-lg p-3 text-white transition-all duration-300 group-hover:scale-110",
          bg
        )}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div className={clsx(
        "absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 transition-all duration-300 group-hover:scale-125",
        bg
      )} />
    </div>
  );
};

const TaskTable = ({ tasks, isAdmin, userId }) => {
  const ICONS = {
    high: <MdKeyboardDoubleArrowUp />,
    medium: <MdKeyboardArrowUp />,
    low: <MdKeyboardArrowDown />,
  };

  const filteredTasks = tasks?.filter(task => 
    isAdmin || (task.team?.members && task.team.members.some(member => member._id === userId))
  ) || [];

  const TableHeader = () => (
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50/50">
        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600 sm:px-6">Task Title</th>
        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600 sm:px-6">Priority</th>
        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-600 sm:px-6 sm:text-left">Team</th>
        <th className="hidden py-4 px-6 text-left text-sm font-semibold text-gray-600 md:table-cell">Created At</th>
      </tr>
    </thead>
  );

  const TableRow = ({ task }) => (
    <tr className="group border-b border-gray-100 transition-colors duration-200 hover:bg-gray-50/50">
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={clsx("h-3 w-3 rounded-full", TASK_TYPE[task.stage] || "bg-gray-300")} />
          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 sm:text-base">{task.title}</p>
        </div>
      </td>
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className={clsx("text-lg", PRIORITYSTYLES[task.priority])}>{ICONS[task.priority]}</span>
          <span className="text-sm capitalize text-gray-600 sm:text-base">{task.priority}</span>
        </div>
      </td>
      <td className="py-4 px-4 sm:px-6">
        <div className="flex justify-center sm:justify-start -space-x-2">
          {task.team?.members?.map((member, index) => (
            <div
              key={member._id || index}
              className={clsx(
                "ring-2 ring-white w-6 h-6 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center text-xs sm:text-sm font-semibold transition-transform duration-200 hover:scale-110 hover:z-10",
                BGS[index % BGS.length]
              )}
            >
              <UserInfo user={member} />
            </div>
          ))}
        </div>
      </td>
      <td className="hidden py-4 px-6 md:table-cell">
        <span className="text-sm text-gray-500">{moment(task?.createdAt || task?.date).fromNow()}</span>
      </td>
    </tr>
  );

  return (
    <div className="flex w-full flex-col rounded-xl bg-white p-4 shadow-lg sm:p-6 md:w-2/3">
      <div className="mb-6 flex flex-col items-center space-y-3 px-2 sm:flex-row sm:justify-between sm:space-y-0">
        <h3 className="text-xl font-semibold text-gray-800">Recent Tasks</h3>
        <div className="h-1 w-20 rounded bg-blue-500" />
      </div>
      {!filteredTasks || filteredTasks.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full table-auto">
            <TableHeader />
            <tbody>{filteredTasks.map((task, id) => <TableRow key={task._id || id} task={task} />)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const UserTable = ({ users, isAdmin }) => {
  if (!isAdmin || !users || users.length === 0) return null;

  const TableHeader = () => (
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50/50">
        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-600 sm:px-6">Full Name</th>
        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-600 sm:px-6 sm:text-left">Status</th>
        <th className="hidden py-4 px-6 text-left text-sm font-semibold text-gray-600 sm:table-cell">Created At</th>
      </tr>
    </thead>
  );

  const TableRow = ({ user }) => (
    <tr className="group border-b border-gray-100 transition-colors duration-200 hover:bg-gray-50/50">
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white ring-4 ring-violet-100 sm:h-10 sm:w-10 sm:text-sm">
            <span>{getInitials(user?.name || "")}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 sm:text-base">{user?.name}</p>
            <span className="text-xs text-gray-500 sm:text-sm">{user?.role}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-center sm:px-6 sm:text-left">
        <span className={clsx(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:text-sm",
          user?.isActive 
            ? "bg-green-50 text-green-700 ring-1 ring-green-600/20" 
            : "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20"
        )}>
          {user?.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="hidden py-4 px-6 text-sm text-gray-500 sm:table-cell">
        {moment(user?.createdAt).fromNow()}
      </td>
    </tr>
  );

  return (
    <div className="flex w-full flex-col rounded-xl bg-white p-4 shadow-lg sm:p-6 md:w-1/3">
      <div className="mb-6 flex flex-col items-center space-y-3 px-2 sm:flex-row sm:justify-between sm:space-y-0">
        <h3 className="text-xl font-semibold text-gray-800">Active Users</h3>
        <div className="h-1 w-20 rounded bg-violet-500" />
      </div>
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full table-auto">
          <TableHeader />
          <tbody>{users.map((user, index) => <TableRow key={user?._id || index} user={user} />)}</tbody>
        </table>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useGetDashboardStatsQuery();
  const isAdmin = user?.isAdmin;

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600">Error Loading Dashboard</h2>
          <p className="mt-2 text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!user || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Access Denied</h2>
          <p className="mt-2 text-gray-600">Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  const userStats = data?.userTasks;

  const stats = [
    {
      _id: "1",
      label: "TOTAL TASKS",
      total: userStats?.total || 0,
      icon: <FaNewspaper />,
      bg: "bg-blue-600",
    },
    {
      _id: "2",
      label: "COMPLETED TASKS",
      total: userStats?.completed || 0,
      icon: <MdAdminPanelSettings />,
      bg: "bg-teal-600",
    },
    {
      _id: "3",
      label: "TASKS IN PROGRESS",
      total: userStats?.["in progress"] || 0,
      icon: <LuClipboardEdit />,
      bg: "bg-amber-500",
    },
    {
      _id: "4",
      label: "TODOS",
      total: userStats?.todo || 0,
      icon: <FaArrowsToDot />,
      bg: "bg-pink-600",
    },
  ];

  return (
    <div className="min-h-full space-y-6 py-4 sm:space-y-8 sm:py-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {stats.map(({ _id, icon, bg, label, total }) => (
          <Card key={_id} icon={icon} bg={bg} label={label} count={total} />
        ))}
      </div>

      {isAdmin && data?.graphData && data.graphData.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-lg sm:p-6">
          <div className="mb-6 flex flex-col items-center space-y-3 px-2 sm:flex-row sm:justify-between sm:space-y-0">
            <h4 className="text-xl font-semibold text-gray-800">Tasks by Priority</h4>
          </div>
          <Chart data={data.graphData} />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row">
        <TaskTable 
          tasks={data?.last10Task} 
          isAdmin={isAdmin}
          userId={user?._id}
        />
        <UserTable 
          users={data?.users} 
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

export default Dashboard;