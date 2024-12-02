import React, { useState } from "react";
import {
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdOutlineRestore,
} from "react-icons/md";
import Title from "../components/Title";
import Button from "../components/Button";
import { PRIORITYSTYLES, TASK_TYPE } from "../utils";
import ConfirmatioDialog from "../components/Dialogs";
import { useDeleteRestoreTaskMutation, useGetAllTasksQuery } from "../redux/slices/api/taskApiSlice";
import Loading from "../components/Loader";
import { toast } from "sonner";
import clsx from "clsx";

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const Trash = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [msg, setMsg] = useState(null);
  const [type, setType] = useState("delete");
  const [selected, setSelected] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading, refetch } = useGetAllTasksQuery({
    strQuery: 'all',  // Get all stages
    isTrashed: 'true', // Only trashed items
    search: ''
  }, {
    refetchOnMountOrArgChange: true // Ensure fresh data on mount
  });

  const [deleteRestoreTask] = useDeleteRestoreTaskMutation();

  const deleteRestoreHandler = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      let result;
      const payload = {
        id: selected,
        actionType: type,
      };

      if (!payload.actionType) {
        throw new Error("Action type is required");
      }

      if (["delete", "restore"].includes(payload.actionType) && !payload.id) {
        throw new Error("Task ID is required for single item operations");
      }

      // For bulk operations, handle differently
      if (payload.actionType === "deleteAll" || payload.actionType === "restoreAll") {
        payload.id = data?.tasks?.map(task => task._id).join(',');
      }

      result = await deleteRestoreTask(payload).unwrap();
      toast.success(result?.message || `Task ${type === 'restore' ? 'restored' : 'deleted'} successfully`);
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetch();
      setOpenDialog(false);
      setSelected("");
      setMsg(null);
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error(error?.data?.message || error.message || "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = (actionType, id = "") => {
    const messages = {
      delete: "Do you want to permanently delete this item?",
      deleteAll: "Do you want to permanently delete all items?",
      restore: "Do you want to restore this item?",
      restoreAll: "Do you want to restore all items in the trash?",
    };

    setType(actionType);
    setSelected(id);
    setMsg(messages[actionType]);
    setOpenDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  const TableHeader = () => (
    <thead>
      <tr className="bg-gray-50">
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Task Title
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Priority
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Stage
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Modified On
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );

  const TableRow = ({ item }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className={clsx("w-3 h-3 rounded-full", TASK_TYPE[item.stage])} />
          <p className="text-sm font-medium text-gray-900 line-clamp-1">
            {item?.title}
          </p>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={clsx("text-lg", PRIORITYSTYLES[item?.priority])}>
            {ICONS[item?.priority]}
          </span>
          <span className="text-sm capitalize text-gray-600">{item?.priority}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-600 capitalize">{item?.stage}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-600">
          {new Date(item?.date).toDateString()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleAction("restore", item._id)}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
          >
            <MdOutlineRestore className="text-xl" />
          </button>
          <button
            onClick={() => handleAction("delete", item._id)}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <MdDelete className="text-xl" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <Title title="Trashed Tasks" />
        <div className="flex gap-3">
          <Button
            label="Restore All"
            icon={<MdOutlineRestore className="text-lg" />}
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "text-sm font-medium text-gray-700 bg-yellow-100",
              "hover:bg-yellow-200 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            )}
            onClick={() => handleAction("restoreAll")}
            disabled={isProcessing || !data?.tasks?.length}
          />
          <Button
            label="Delete All"
            icon={<MdDelete className="text-lg" />}
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "text-sm font-medium text-white bg-red-600",
              "hover:bg-red-700 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            )}
            onClick={() => handleAction("deleteAll")}
            disabled={isProcessing || !data?.tasks?.length}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <TableHeader />
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.tasks?.map((task, index) => (
                <TableRow key={task._id || index} item={task} />
              ))}
              {!data?.tasks?.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-sm">No tasks in trash</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmatioDialog
        open={openDialog}
        setOpen={setOpenDialog}
        msg={msg}
        setMsg={setMsg}
        type={type}
        setType={setType}
        onClick={deleteRestoreHandler}
        disabled={isProcessing}
      />
    </div>
  );
};

export default Trash;