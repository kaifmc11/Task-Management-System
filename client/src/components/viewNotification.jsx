import React from "react";
import { Dialog } from "@headlessui/react";
import ModalWrapper from "./ModalWrapper";
import Button from "./Button";

const ViewNotification = ({ open, setOpen, el }) => {
  if (!el) return null;

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <Dialog.Title className="text-lg font-semibold mb-4">
        {el?.task?.title || "Notification"}
      </Dialog.Title>
      
      <div className="mb-6">
        <p className="text-gray-700">{el?.text}</p>
        {el?.task && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Task Details:</h4>
            <p className="text-sm text-gray-600">Priority: {el.task.priority}</p>
            <p className="text-sm text-gray-600">
              Due Date: {new Date(el.task.date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">Stage: {el.task.stage}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setOpen(false)}
          label="Close"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        />
      </div>
    </ModalWrapper>
  );
};

export default ViewNotification;