import React, { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AiTwotoneFolderOpen } from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import { HiDuplicate } from "react-icons/hi";
import { MdAdd, MdOutlineEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Menu, Transition } from "@headlessui/react";
import AddTask from "./AddTask";
import AddSubTask from "./AddSubTask";
import ConfirmatioDialog from "../Dialogs";
import { useDuplicateTaskMutation, useTrashTaskMutation } from "../../redux/slices/api/taskApiSlice";
import { toast } from "sonner";

const TaskDialog = ({ task }) => {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const [deleteTask] = useTrashTaskMutation();
  const [duplicateTask] = useDuplicateTaskMutation();
  const { user } = useSelector((state) => state.auth);

  const duplicateHandler = async () => {
    if (!task?._id) {
      toast.error("Invalid task ID");
      return;
    }

    try {
      const res = await duplicateTask(task._id).unwrap();
      toast.success(res?.message);
      setTimeout(() => {
        setOpenDialog(false);
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Error duplicating task:", err);
      toast.error(err?.data?.message || "Failed to duplicate task");
    }
  };

  const deleteClicks = () => {
    if (!task?._id) {
      toast.error("Invalid task ID");
      return;
    }
    setOpenDialog(true);
  };

  const deleteHandler = async () => {
    if (!task?._id) {
      toast.error("Invalid task ID");
      return;
    }
  
    try {
      setIsDeleting(true);
      const res = await deleteTask({
        id: task._id,
        actionType: 'delete'
      }).unwrap();
  
      toast.success(res?.message || "Task moved to trash");
      setTimeout(() => {
        setOpenDialog(false);
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error moving task to trash:", error);
      toast.error(error?.data?.message || "Failed to move task to trash");
    } finally {
      setIsDeleting(false);
    }
  };

  // Validate task prop
  if (!task) {
    return null;
  }

  // Base items available to all users
  const baseItems = [
    {
      label: "Open Task",
      icon: <AiTwotoneFolderOpen className="mr-2 h-5 w-5" aria-hidden="true" />,
      onClick: () => navigate(`/task/${task._id}`),
    },
    {
      label: "Edit",
      icon: <MdOutlineEdit className="mr-2 h-5 w-5" aria-hidden="true" />,
      onClick: () => setOpenEdit(true),
    },
  ];

  // Additional items only for admin users
  const adminItems = [
    {
      label: "Add Sub-Task",
      icon: <MdAdd className="mr-2 h-5 w-5" aria-hidden="true" />,
      onClick: () => setOpen(true),
    },
    {
      label: "Duplicate",
      icon: <HiDuplicate className="mr-2 h-5 w-5" aria-hidden="true" />,
      onClick: duplicateHandler,
    },
  ];

  // Combine items based on user role
  const menuItems = user?.isAdmin ? [...baseItems, ...adminItems] : baseItems;

  return (
    <>
      <div className="flex justify-center items-center">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="inline-flex w-full justify-center rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm focus:outline-none transition duration-150 ease-in-out">
            <BsThreeDots className="text-xl text-gray-500 hover:text-gray-700" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute p-4 right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
              <div className="px-1 py-1 space-y-2">
                {menuItems.map((el) => (
                  <Menu.Item key={el.label}>
                    {({ active }) => (
                      <button
                        onClick={el?.onClick}
                        className={`${
                          active ? "bg-blue-500 text-white" : "text-gray-900"
                        } flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200`}
                      >
                        {el.icon}
                        {el.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>

              {user?.isAdmin && (
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={deleteClicks}
                        disabled={isDeleting}
                        className={`${
                          active ? "bg-red-500 text-white" : "text-red-600"
                        } flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                          isDeleting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <RiDeleteBin6Line className="mr-2 h-5 w-5 text-red-400" aria-hidden="true" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <AddTask open={openEdit} setOpen={setOpenEdit} task={task} key={task._id} />
      <AddSubTask open={open} setOpen={setOpen} taskId={task._id} />
      <ConfirmatioDialog 
        open={openDialog} 
        setOpen={setOpenDialog} 
        onClick={deleteHandler}
        isLoading={isDeleting}
        title="Delete Task"
        description="Are you sure you want to move this task to trash? This action can be undone later."
      />
    </>
  );
};

export default TaskDialog;