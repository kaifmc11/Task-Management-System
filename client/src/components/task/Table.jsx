import React, { useState } from "react";
import { BiMessageAltDetail } from "react-icons/bi";
import {
  MdAttachFile,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { FaList } from "react-icons/fa";
import { toast } from "sonner";
import clsx from "clsx";
import { BGS, PRIORITYSTYLES, TASK_TYPE, formatDate } from "../../utils";
import UserInfo from "../UserInfo";
import Button from "../Button";
import ConfirmatioDialog from "../Dialogs";
import { useTrashTaskMutation } from "../../redux/slices/api/taskApiSlice";
import AddTask from "./AddTask";

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const Table = ({ tasks = [] }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [trashTask] = useTrashTaskMutation();

  const deleteClicks = (id) => {
    setSelected(id);
    setOpenDialog(true);
  };

  const editTaskHandler = (el) => {
    setSelected(el);
    setOpenEdit(true);
  };

  const deleteHandler = async () => {
    try {
      const result = await trashTask({
        id: selected,
        isTrash: "trash",
      }).unwrap();
      toast.success(result?.message);

      setTimeout(() => {
        setOpenDialog(false);
        window.location.reload();
      }, 500);
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || err.error);
    }
  };

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-white p-8 text-gray-500 shadow-lg">
        <div className="text-center">
          <FaList className="mx-auto mb-4 h-8 w-8 text-gray-400" />
          <p className="text-lg">No tasks available to display</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full table-auto">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr className="text-left">
                <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                  Task Title
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                  Priority
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                  Created At
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                  Assets
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                  Team
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600 text-right"
                style={{paddingRight:"70px"}}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <tr
                  key={task._id}
                  className="group transition-colors duration-200 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "h-3 w-3 rounded-full transition-transform duration-200 group-hover:scale-110",
                          TASK_TYPE[task.stage]
                        )}
                      />
                      <p className="line-clamp-2 font-medium text-gray-900">
                        {task?.title}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-lg",
                          task?.priority === "high" && "bg-red-50 text-red-600",
                          task?.priority === "medium" && "bg-amber-50 text-amber-600",
                          task?.priority === "low" && "bg-green-50 text-green-600"
                        )}
                      >
                        {ICONS[task?.priority]}
                      </span>
                      <span className="capitalize text-gray-700">
                        {task?.priority} Priority
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {formatDate(new Date(task?.date))}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-sm text-blue-600">
                        <BiMessageAltDetail />
                        <span>{task?.activities?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-sm text-purple-600">
                        <MdAttachFile />
                        <span>{task?.assets?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-1 text-sm text-teal-600">
                        <FaList />
                        <span>0/{task?.subTasks?.length || 0}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {Array.isArray(task?.team) ? (
                        task.team.map((m, index) => (
                          <div
                            key={m._id}
                            className={clsx(
                              "flex h-8 w-8 items-center justify-center rounded-full text-sm text-white ring-2 ring-white transition-transform duration-200 hover:z-10 hover:scale-110",
                              BGS[index % BGS?.length]
                            )}
                          >
                            <UserInfo user={m} />
                          </div>
                        ))
                      ) : task?.team ? (
                        <div
                          className={clsx(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm text-white ring-2 ring-white",
                            BGS[0]
                          )}
                        >
                          <UserInfo user={task.team} />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          No team assigned
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700"
                        label="Edit"
                        type="button"
                        onClick={() => editTaskHandler(task)}
                      />
                      <Button
                        className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 hover:border-red-700 hover:text-red-700"
                        label="Delete"
                        type="button"
                        onClick={() => deleteClicks(task._id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmatioDialog
        open={openDialog}
        setOpen={setOpenDialog}
        onClick={deleteHandler}
      />

      <AddTask
        open={openEdit}
        setOpen={setOpenEdit}
        task={selected}
        key={selected?._id || "new"}
      />
    </>
  );
};

export default Table;