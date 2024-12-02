import React, { useState } from "react";
import { MdAttachFile, MdKeyboardArrowDown, MdKeyboardArrowUp, MdKeyboardDoubleArrowUp } from "react-icons/md";
import { useSelector } from "react-redux";
import { BiMessageAltDetail } from "react-icons/bi";
import { FaList } from "react-icons/fa";
import { HiUserGroup } from "react-icons/hi";
import { IoMdAdd } from "react-icons/io";
import { BsPerson } from "react-icons/bs";
import clsx from "clsx";
import { PRIORITYSTYLES, formatDate } from "../utils";
import TaskDialog from '../components/task/TaskDialog';
import AddSubTask from "./task/AddSubTask";

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
  normal: <MdKeyboardArrowDown />,
};

const STAGE_COLORS = {
  todo: "bg-blue-500",
  "in progress": "bg-yellow-500",
  completed: "bg-green-500",
};

const TaskCard = ({ task }) => {
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  if (!task) {
    return (
      <div className="w-full h-[420px] bg-white shadow-lg p-6 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">Task data unavailable</p>
      </div>
    );
  }

  const allMembers = [...(task?.members || [])];
  if (task?.team?.members) {
    allMembers.push(...task.team.members);
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDaysUntilDeadline = () => {
    if (!task.dueDate) return null;
    
    const now = new Date();
    const deadline = new Date(task.dueDate);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days remaining`;
  };

  return (
    <>
      <div className="w-full h-[420px] bg-white shadow-lg rounded-xl transition-shadow duration-200 hover:shadow-xl flex flex-col">
        {/* Header Section - Fixed Height */}
        <div className="p-4 border-b border-gray-100 h-[120px]">
          <div className="flex justify-between items-center mb-3">
            <div
              className={clsx(
                "flex gap-2 items-center text-sm font-semibold",
                PRIORITYSTYLES[task?.priority] || PRIORITYSTYLES.normal
              )}
            >
              <span className="text-lg">{ICONS[task?.priority] || ICONS.normal}</span>
              <span className="uppercase">{(task?.priority || 'normal').toUpperCase()} Priority</span>
            </div>
            <TaskDialog task={task} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={clsx("w-4 h-4 rounded-full", 
                  STAGE_COLORS[task?.stage?.toLowerCase()] || STAGE_COLORS.todo
                )}
              />
              <h4 className="text-black font-bold text-lg line-clamp-1">
                {task?.title || 'Untitled Task'}
              </h4>
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              {task?.team?.name ? (
                <>
                  <HiUserGroup className="text-lg" />
                  <span className="text-sm font-medium">{task.team.name}</span>
                </>
              ) : (
                <>
                  <BsPerson className="text-lg" />
                  <span className="text-sm font-medium">Individual Task</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Section - Flexible Height with Min Height */}
        <div className="flex-1 p-4 flex flex-col min-h-[200px]">
          {/* Members Section - Fixed Height */}
          <div className="h-[40px]">
            {allMembers.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden">
                {allMembers.slice(0, 4).map((member, index) => (
                  <div
                    key={member._id}
                    className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
                    title={member.name}
                  >
                    {getInitials(member.name)}
                  </div>
                ))}
                {allMembers.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium ring-2 ring-white">
                    +{allMembers.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dates Section - Fixed Height */}
          <div className="h-[60px]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Start: {formatDate(new Date(task?.date || Date.now()))}
              </span>
              <span className="text-gray-600 font-medium">
                {task.dueDate ? (
                  <>Due: {formatDate(new Date(task.dueDate))}</>
                ) : (
                  'No deadline set'
                )}
              </span>
            </div>
            {task.dueDate && (
              <div className="text-sm text-gray-600 font-medium mt-1">
                {getDaysUntilDeadline()}
              </div>
            )}
          </div>

          {/* Task Statistics - Fixed Height */}
          <div className="h-[50px] flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex gap-1 items-center text-sm text-gray-500">
                <BiMessageAltDetail />
                <span>{task?.activities?.length || 0}</span>
              </div>
              <div className="flex gap-1 items-center text-sm text-gray-500">
                <MdAttachFile />
                <span>{task?.assets?.length || 0}</span>
              </div>
              <div className="flex gap-1 items-center text-sm text-gray-500">
                <FaList />
                <span>{task?.subTasks?.length || 0}</span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">
              {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Subtasks Section - Fixed Height */}
          <div className="h-[100px] flex flex-col justify-center border-t border-gray-100">
            {task?.subTasks?.length > 0 ? (
              <div>
                <h5 className="text-base text-black font-semibold mb-2 line-clamp-1">
                  {task.subTasks[0].title}
                </h5>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {formatDate(new Date(task.subTasks[0].date))}
                  </span>
                  {task.subTasks[0].tag && (
                    <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-600 text-sm font-medium">
                      {task.subTasks[0].tag}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-gray-500">
                No Subtask
              </div>
            )}
          </div>
        </div>

        {/* Footer Section - Fixed Height */}
        <div className="h-[50px] p-4 border-t border-gray-100 flex items-center">
          <button
            onClick={() => setOpen(true)}
            disabled={!user?.isAdmin}
            className="w-full flex gap-4 items-center justify-center text-sm text-blue-500 font-semibold disabled:cursor-not-allowed disabled:text-gray-300 hover:text-blue-700 transition-colors"
          >
            <IoMdAdd className="text-lg" />
            <span>ADD SUBTASK</span>
          </button>
        </div>
      </div>

      <AddSubTask open={open} setOpen={setOpen} id={task._id} />
    </>
  );
};

export default TaskCard;