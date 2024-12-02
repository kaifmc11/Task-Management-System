import React, { useState, useEffect } from "react";
import { FaList } from "react-icons/fa";
import { MdGridView } from "react-icons/md";
import { useParams } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import Loading from "../components/Loader";
import Title from "../components/Title";
import Button from "../components/Button";
import TaskTitle from "../components/TaskTitle";
import BoardView from "../components/BoardView";
import Table from "../components/task/Table";
import AddTask from "../components/task/AddTask";
import TeamFilter from "../components/task/TeamFilter";
import { useGetAllTasksQuery } from "../redux/slices/api/taskApiSlice";
import { useSelector } from "react-redux";
import { useGetUsersQuery } from "../redux/slices/api/userApiSlice";
import { Tab } from "@headlessui/react";
import { toast } from 'sonner';

const TASK_TYPE = {
  todo: "bg-blue-500",
  "in progress": "bg-yellow-500",
  completed: "bg-green-500",
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Tasks = () => {
  const params = useParams();
  const [selectedTab, setSelectedTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const { user } = useSelector((state) => state.auth);
  const { data: usersData } = useGetUsersQuery();
  const currentUser = usersData?.find(u => u._id === user?._id);
  const isAdmin = currentUser?.isAdmin === true;

  const status = params?.status?.toLowerCase() || "";

  // Add skip option to prevent automatic refetching when there's an error
  const { data, isLoading, error, refetch } = useGetAllTasksQuery({
    strQuery: status || taskFilter || "",
    isTrashed: "false",
    search: "",
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 60000,
    skip: retryCount > 3, // Skip further requests after 3 retries
  });

  // Enhanced error handling with retry logic
  useEffect(() => {
    if (error) {
      console.error('Task Fetch Error:', error);
      const errorMessage = error?.data?.message || error?.error || 'Unknown error occurred';
      
      // Check if it's the specific MongoDB Document error
      if (errorMessage.includes('Parameter "obj" to Document()')) {
        toast.error('Error: Invalid task data format. Please contact support.');
      } else {
        toast.error(`Error loading tasks: ${errorMessage}`);
      }

      // Implement exponential backoff for retries
      if (retryCount < 3) {
        const timeout = Math.pow(2, retryCount) * 1000;
        const retryTimer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          refetch();
        }, timeout);

        return () => clearTimeout(retryTimer);
      }
    }
  }, [error, retryCount, refetch]);

  // Reset retry count on successful data fetch
  useEffect(() => {
    if (data) {
      setRetryCount(0);
    }
  }, [data]);

  // Effect to refetch when task is added
  useEffect(() => {
    if (!open) {
      refetch();
    }
  }, [open, refetch]);

  // Safe data extraction with validation
  const teams = React.useMemo(() => {
    try {
      return [...new Set(data?.tasks
        ?.filter(task => task && task.team && typeof task.team === 'object')
        ?.map(task => task.team.name)
        ?.filter(Boolean) || []
      )];
    } catch (err) {
      console.error('Error extracting team data:', err);
      return [];
    }
  }, [data?.tasks]);

  // Enhanced filtering logic with validation
  const filteredTasks = React.useMemo(() => {
    if (!Array.isArray(data?.tasks)) {
      return [];
    }

    try {
      return data.tasks.filter(task => {
        if (!task || typeof task !== 'object') return false;
        
        // Validate team data structure
        const hasValidTeam = selectedTeam 
          ? task?.team && typeof task.team === 'object' && task.team.name === selectedTeam 
          : true;
        
        // Validate status/stage
        const hasValidStatus = status || taskFilter
          ? task?.stage && task.stage.toLowerCase() === (status || taskFilter).toLowerCase()
          : true;

        return hasValidTeam && hasValidStatus;
      });
    } catch (err) {
      console.error('Error filtering tasks:', err);
      return [];
    }
  }, [data?.tasks, selectedTeam, status, taskFilter]);

  const handleFilterChange = (filter) => {
    setTaskFilter(filter.toLowerCase());
  };

  const handleRetry = () => {
    setRetryCount(0);
    refetch();
  };

  if (isLoading) return <div className="py-10"><Loading /></div>;
  
  if (error) {
    return (
      <div className="py-10 flex flex-col items-center justify-center space-y-4">
        <p className="text-red-600">
          {retryCount >= 3 
            ? "Multiple retry attempts failed. Please try again later."
            : `Error loading tasks: ${error?.data?.message || error?.error || 'Unknown error occurred'}`}
        </p>
        <Button
          onClick={handleRetry}
          label="Try Again"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        />
      </div>
    );
  }

  const noTasksMessage = (
    <div className="text-center py-10 text-gray-500">
      <p>No tasks found. {isAdmin && 'Click "Create Task" to add a new task.'}</p>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <Title title={status ? `${status.toUpperCase()} Tasks` : "Tasks"} />
        <div className="flex items-center gap-4">
          {teams.length > 0 && (
            <TeamFilter 
              teams={teams}
              selectedTeam={selectedTeam}
              onTeamSelect={setSelectedTeam}
            />
          )}
          {!status && isAdmin && (
            <Button
              onClick={() => setOpen(true)}
              label="Create Task"
              icon={<IoMdAdd className="text-lg" />}
              className="flex flex-row-reverse gap-1 items-center bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 transition-colors"
            />
          )}
        </div>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-6 rounded-xl p-1 border-b border-gray-300 bg-white shadow-sm">
          <Tab
            className={({ selected }) =>
              classNames(
                "w-fit flex items-center outline-none gap-2 px-4 py-3 text-base font-medium leading-5 transition-all duration-200",
                selected
                  ? "text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-800 hover:text-blue-800"
              )
            }
          >
            <MdGridView />
            <span>Board View</span>
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-fit flex items-center outline-none gap-2 px-4 py-3 text-base font-medium leading-5 transition-all duration-200",
                selected
                  ? "text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-800 hover:text-blue-800"
              )
            }
          >
            <FaList />
            <span>List View</span>
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-6">
          <Tab.Panel>
            <div className="w-full">
              {!status && (
                <div className="w-full flex justify-between gap-4 md:gap-x-12 py-4">
                  <TaskTitle 
                    label="To Do" 
                    className={TASK_TYPE.todo} 
                    onClick={() => handleFilterChange("todo")} 
                  />
                  <TaskTitle 
                    label="In Progress" 
                    className={TASK_TYPE["in progress"]} 
                    onClick={() => handleFilterChange("in progress")} 
                  />
                  <TaskTitle 
                    label="Completed" 
                    className={TASK_TYPE.completed} 
                    onClick={() => handleFilterChange("completed")} 
                  />
                </div>
              )}
              {filteredTasks.length > 0 ? (
                <BoardView tasks={filteredTasks} filter={status || taskFilter} />
              ) : noTasksMessage}
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="w-full">
              {!status && (
                <div className="w-full flex justify-between gap-4 md:gap-x-12 py-4">
                  <TaskTitle 
                    label="To Do" 
                    className={TASK_TYPE.todo} 
                    onClick={() => handleFilterChange("todo")} 
                  />
                  <TaskTitle 
                    label="In Progress" 
                    className={TASK_TYPE["in progress"]} 
                    onClick={() => handleFilterChange("in progress")} 
                  />
                  <TaskTitle 
                    label="Completed" 
                    className={TASK_TYPE.completed} 
                    onClick={() => handleFilterChange("completed")} 
                  />
                </div>
              )}
              <div className="w-full bg-white rounded-lg shadow-md p-4">
                {filteredTasks.length > 0 ? (
                  <Table tasks={filteredTasks} />
                ) : noTasksMessage}
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <AddTask open={open} setOpen={setOpen} />
    </div>
  );
};

export default Tasks;