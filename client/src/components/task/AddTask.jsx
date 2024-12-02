import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import Button from "../Button";
import ModalWrapper from "../ModalWrapper";
import SelectList from "../SelectList";
import { toast } from 'sonner';
import Textbox from "../Textbox";
import { 
  useCreateTaskMutation, 
  useUpdateTaskMutation,
  useGetAllTasksQuery
} from "../../redux/slices/api/taskApiSlice";
import { dateFormatter } from "../../utils";
import { useGetTeamsQuery } from "../../redux/slices/api/teamApiSlice";
import { useGetUsersQuery } from "../../redux/slices/api/userApiSlice";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORITY_CONFIG = [
  { level: "HIGH", duration: 1, label: "High - Due in 1 day" },
  { level: "MEDIUM", duration: 3, label: "Medium - Due in 3 days" },
  { level: "NORMAL", duration: 7, label: "Normal - Due in 7 days" },
  { level: "LOW", duration: 14, label: "Low - Due in 14 days" }
];

const AddTask = ({ open, setOpen, task }) => {
  const { refetch } = useGetAllTasksQuery({
    strQuery: "",
    isTrashed: "false",
    search: "",
  });

  const defaultValues = {
    title: task?.title || "",
    date: dateFormatter(task?.date || new Date()),
    stage: task?.stage || LISTS[0],
    priority: task?.priority || PRIORITY_CONFIG[2].level,
    dueDate: task?.dueDate || ""
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({ defaultValues });

  const [availableTeamMembers, setAvailableTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [stage, setStage] = useState(task?.stage?.toUpperCase() || LISTS[0]);
  const [priority, setPriority] = useState(task?.priority?.toUpperCase() || PRIORITY_CONFIG[2].level);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isIndividualAssignment, setIsIndividualAssignment] = useState(false);

  const watchDate = watch("date");

  const { data: teams, isLoading: isTeamsLoading } = useGetTeamsQuery();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery({
    search: userSearchQuery
  });

  // Initialize task data on component mount
  useEffect(() => {
    if (task) {
      // Set individual assignment mode if task has individual members
      const hasIndividualMembers = task.members && task.members.length > 0;
      setIsIndividualAssignment(hasIndividualMembers);

      // Initialize selected team and members
      if (task.team) {
        setSelectedTeamId(task.team._id);
        // Set team members
        const teamMembers = task.team.members || [];
        setAvailableTeamMembers(teamMembers);
        
        // Set selected members from both team and individual assignments
        const allMembers = [
          ...(task.team.members || []),
          ...(task.members || [])
        ];
        setSelectedMembers(allMembers);
      } else if (task.members) {
        setSelectedMembers(task.members);
      }
    }
  }, [task]);

  useEffect(() => {
    if (watchDate) {
      const selectedPriority = PRIORITY_CONFIG.find(p => p.level === priority);
      if (selectedPriority) {
        const startDate = new Date(watchDate);
        const dueDate = new Date(startDate.setDate(startDate.getDate() + selectedPriority.duration));
        const formattedDueDate = dateFormatter(dueDate);
        setValue("dueDate", formattedDueDate);
      }
    }
  }, [watchDate, priority, setValue]);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // Handle team selection
  useEffect(() => {
    if (selectedTeamId && teams) {
      const selectedTeam = teams.find(t => t._id === selectedTeamId);
      if (selectedTeam) {
        setAvailableTeamMembers(selectedTeam.members || []);
        
        // Only auto-select all team members for new tasks
        if (!task) {
          setSelectedMembers(selectedTeam.members || []);
        }
      }
    }
  }, [selectedTeamId, teams, task]);

  const handleMemberToggle = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m._id === member._id);
      if (isSelected) {
        return prev.filter(m => m._id !== member._id);
      } else {
        return [...prev, member];
      }
    });
  };

  const isMemberSelected = (memberId) => {
    return selectedMembers.some(member => member._id === memberId);
  };

  const handleTeamChange = (e) => {
    const teamId = e.target.value;
    setSelectedTeamId(teamId);
    
    if (teamId) {
      const selectedTeam = teams?.find(t => t._id === teamId);
      if (selectedTeam) {
        setAvailableTeamMembers(selectedTeam.members || []);
        // Don't auto-select members when changing teams in edit mode
        if (!task) {
          setSelectedMembers(selectedTeam.members || []);
        }
      }
    } else {
      setAvailableTeamMembers([]);
      if (!task) {
        setSelectedMembers([]);
      }
    }
    
    if (!task) {
      setIsIndividualAssignment(false);
    }
  };

  const submitHandler = async (data) => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    try {
      const taskData = {
        title: data.title,
        date: data.date,
        dueDate: data.dueDate,
        team: selectedTeamId ? {
          _id: selectedTeamId,
          name: teams?.find(t => t._id === selectedTeamId)?.name,
          members: selectedMembers.filter(member => 
            availableTeamMembers.some(tm => tm._id === member._id)
          ).map(member => ({
            _id: member._id,
            name: member.name,
            email: member.email,
            avatar: member.avatar || ""
          })),
          createdBy: teams?.find(t => t._id === selectedTeamId)?.createdBy
        } : null,
        members: isIndividualAssignment || !selectedTeamId ? 
          selectedMembers.filter(member => 
            !availableTeamMembers.some(tm => tm._id === member._id)
          ) : [],
        stage: stage.toLowerCase(),
        priority: priority.toLowerCase()
      };

      let response;
      
      if (task?._id) {
        if (!LISTS.includes(stage.toUpperCase())) {
          toast.error("Invalid task stage. Please select TODO, IN PROGRESS, or COMPLETED");
          return;
        }
        
        response = await updateTask({
          _id: task._id,
          ...taskData
        }).unwrap();
      } else {
        response = await createTask(taskData).unwrap();
      }

      toast.success(response.message);
      await refetch();
      reset();
      setSelectedMembers([]);
      setSelectedTeamId("");
      setOpen(false);

    } catch (err) {
      console.error("Task submission error:", err);
      toast.error(err?.data?.message || "An error occurred while saving the task");
    }
  };

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
        <Dialog.Title as="h2" className="text-base font-bold leading-6 text-gray-900 mb-4">
          {task ? "UPDATE TASK" : "ADD TASK"}
        </Dialog.Title>

        <div className="space-y-6">
          <Textbox
            placeholder="Task Title"
            type="text"
            name="title"
            label="Task Title"
            className="w-full rounded"
            register={register("title", { required: "Title is required" })}
            error={errors.title ? errors.title.message : ""}
          />

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="individualAssignment"
              checked={isIndividualAssignment}
              onChange={(e) => {
                setIsIndividualAssignment(e.target.checked);
                if (e.target.checked) {
                  setSelectedTeamId("");
                  // Keep selected members in edit mode
                  if (!task) {
                    setSelectedMembers([]);
                  }
                }
              }}
              className="rounded border-gray-300"
            />
            <label htmlFor="individualAssignment" className="text-sm text-gray-700">
              Assign to individual members
            </label>
          </div>

          {!isIndividualAssignment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Team
              </label>
              <select
                className="w-full rounded-md border border-gray-300 p-2"
                value={selectedTeamId}
                onChange={handleTeamChange}
              >
                <option value="">Select a team</option>
                {teams?.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(isIndividualAssignment || selectedTeamId) && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {isIndividualAssignment ? "Search Users" : "Team Members"}
              </label>
              {isIndividualAssignment && (
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              )}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                {(isIndividualAssignment ? users : availableTeamMembers)?.map((member) => (
                  <div key={member._id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`member-${member._id}`}
                      checked={isMemberSelected(member._id)}
                      onChange={() => handleMemberToggle(member)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`member-${member._id}`} className="text-sm text-gray-700">
                      {member.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Selected Members ({selectedMembers.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div 
                    key={member._id} 
                    className="px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-800 flex items-center gap-2"
                  >
                    <span>{member.name}</span>
                    <button
                      type="button"
                      onClick={() => handleMemberToggle(member)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <SelectList
              label="Task Stage"
              lists={LISTS}
              selected={stage}
              setSelected={setStage}
            />

            <div className="w-full">
              <Textbox
                placeholder="Start Date"
                type="date"
                name="date"
                label="Start Date"
                className="w-full rounded"
                register={register("date", {
                  required: "Start date is required!",
                })}
                error={errors.date ? errors.date.message : ""}
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level & Duration
            </label>
            <select
              className="w-full rounded-md border border-gray-300 p-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITY_CONFIG.map((p) => (
                <option key={p.level} value={p.level}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <Textbox
              placeholder="Due Date"
              type="date"
              name="dueDate"
              label="Due Date (Auto-calculated)"
              className="w-full rounded bg-gray-50"
              register={register("dueDate")}
              disabled={true}
            />
          </div>
        </div>

        <div className="bg-gray-50 py-6 flex flex-row-reverse gap-4">
          <Button
            label={isLoading || isUpdating ? "Saving..." : "Submit"}
            type="submit"
            disabled={isLoading || isUpdating}
            className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
          />
          <Button
            type="button"
            className="bg-white px-5 text-sm font-semibold text-gray-900"
            onClick={() => setOpen(false)}
            label="Cancel"
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddTask;