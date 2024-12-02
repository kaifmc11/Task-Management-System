import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import clsx from 'clsx';
import moment from 'moment';
import { FaBug, FaTasks, FaThumbsUp, FaUser, FaUsers } from 'react-icons/fa';
import { GrInProgress } from 'react-icons/gr';
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdOutlineDoneAll,
  MdOutlineMessage,
  MdTaskAlt,
  MdCalendarToday
} from 'react-icons/md';
import { RxActivityLog } from 'react-icons/rx';

import { useGetTaskQuery, useUpdateTaskMutation, usePostTaskActivityMutation } from '../redux/slices/api/taskApiSlice';
import { PRIORITYSTYLES, TASK_TYPE, getInitials } from '../utils';
import Loading from '../components/Loader';
import Tabs from '../components/Tabs';
import Button from '../components/Button';
import AssetManagement from '../components/AssetManagement';

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const bgColor = {
  high: "bg-red-200",
  medium: "bg-yellow-200",
  low: "bg-blue-200",
};

const TABS = [
  { title: "Task Detail", icon: <FaTasks /> },
  { title: "Activities/Timeline", icon: <RxActivityLog /> },
];

const TASKTYPEICON = {
  commented: (
    <div className='w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white'>
      <MdOutlineMessage />
    </div>
  ),
  started: (
    <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white'>
      <FaThumbsUp size={20} />
    </div>
  ),
  assigned: (
    <div className='w-6 h-6 flex items-center justify-center rounded-full bg-gray-500 text-white'>
      <FaUser size={14} />
    </div>
  ),
  bug: (
    <div className='text-red-600'>
      <FaBug size={24} />
    </div>
  ),
  completed: (
    <div className='w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white'>
      <MdOutlineDoneAll size={24} />
    </div>
  ),
  "in progress": (
    <div className='w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 text-white'>
      <GrInProgress size={16} />
    </div>
  ),
};

const act_types = [
  "Started",
  "Completed",
  "In Progress",
  "Commented",
  "Bug",
  "Assigned",
];

const Activities = ({ activity, id, refetch }) => {
  const [selected, setSelected] = useState(act_types[0]);
  const [text, setText] = useState("");
  const [postActivity] = usePostTaskActivityMutation();

  const validateForm = () => {
    if (!text.trim()) {
      toast.error("Activity description is required");
      return false;
    }
    if (!selected) {
      toast.error("Please select an activity type");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const activityData = {
        type: selected?.toLowerCase(),
        activity: text.trim(),
      };
      
      const result = await postActivity({
        data: activityData,
        id
      }).unwrap();

      setText("");
      toast.success(result?.message);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "An error occurred");
    }
  };

  const ActivityCard = ({ item }) => (
    <div className='flex space-x-4'>
      <div className='flex flex-col items-center flex-shrink-0'>
        <div className='w-10 h-10 flex items-center justify-center'>
          {TASKTYPEICON[item?.type]}
        </div>
        <div className='w-full flex items-center'>
          <div className='w-0.5 bg-gray-300 h-full'></div>
        </div>
      </div>

      <div className='flex flex-col gap-y-1 mb-8'>
        <p className='font-semibold'>{item?.by?.name}</p>
        <div className='text-gray-500 space-y-2'>
          <span className='capitalize'>{item?.type}</span>
          <span className='text-sm ml-2'>{moment(item?.date).fromNow()}</span>
        </div>
        <div className='text-gray-700'>{item?.activity}</div>
      </div>
    </div>
  );

  return (
    <div className='w-full flex gap-10 2xl:gap-20 min-h-screen px-10 py-8 bg-white shadow rounded-md justify-between'>
      <div className='w-full md:w-1/2'>
        <h4 className='text-gray-600 font-semibold text-lg mb-5'>Activities</h4>
        <div className='w-full'>
          {activity?.map((el, index) => (
            <ActivityCard
              key={index}
              item={el}
            />
          ))}
        </div>
      </div>

      <div className='w-full md:w-1/3'>
        <h4 className='text-gray-600 font-semibold text-lg mb-5'>Add Activity</h4>
        <div className='w-full flex flex-wrap gap-5'>
          {act_types.map((item) => (
            <div key={item} className='flex gap-2 items-center'>
              <input
                type='checkbox'
                className='w-4 h-4'
                checked={selected === item}
                onChange={() => setSelected(item)}
              />
              <p>{item}</p>
            </div>
          ))}
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Type your activity description here...'
            className='bg-white w-full mt-10 border border-gray-300 outline-none p-4 rounded-md focus:ring-2 ring-blue-500'
          />
          <Button
            type='button'
            label='Submit'
            onClick={handleSubmit}
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
          />
        </div>
      </div>
    </div>
  );
};

const MembersList = ({ members, title, icon }) => (
  <div className='space-y-4 py-6'>
    <div className='flex items-center gap-2'>
      {icon}
      <p className='text-gray-600 font-semibold text-sm'>{title}</p>
    </div>
    <div className='space-y-3'>
      {members?.map((member) => (
        <div key={member?._id} className='flex gap-4 py-2 items-center border-t border-gray-200'>
          <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm bg-blue-600">
            <span>{getInitials(member?.name)}</span>
          </div>
          <div>
            <p className='text-lg font-semibold'>{member?.name}</p>
            <span className='text-gray-500'>{member?.email}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TaskDetails = () => {
  const { id } = useParams();
  const [selected, setSelected] = useState(0);
  
  const { data: taskData, isLoading: taskLoading, refetch: refetchTask } = useGetTaskQuery(id);
  const [updateTask] = useUpdateTaskMutation();

  if (taskLoading) {
    return (
      <div className="py-10">
        <Loading />
      </div>
    );
  }

  const task = taskData?.task;
  if (!task) return <div>No task found</div>;

  const teamMembers = task?.team?.members || [];
  const individualMembers = task?.members || [];
  const formattedDate = task?.createdAt ? moment(task.createdAt).format('MMMM D, YYYY') : 'Date not available';
  const formattedDueDate = task?.dueDate ? moment(task.dueDate).format('MMMM D, YYYY') : 'No due date set';
  const subtasks = task?.subTasks || [];

  return (
    <div className='w-full flex flex-col gap-3 mb-4'>
      <h1 className='text-2xl text-gray-600 font-bold'>{task?.title}</h1>

      <Tabs tabs={TABS} setSelected={setSelected}>
        {selected === 0 ? (
          <div className='w-full flex flex-col md:flex-row gap-5 2xl:gap-8 bg-white shadow-md p-8'>
            {/* Left Side - Task Details */}
            <div className='w-full md:w-1/2 space-y-8'>
              {/* Priority and Stage Section */}
              <div className='flex items-center gap-5'>
                <div className={clsx(
                  "flex gap-1 items-center text-base font-semibold px-3 py-1 rounded-full",
                  PRIORITYSTYLES[task?.priority],
                  bgColor[task?.priority]
                )}>
                  <span className='text-lg'>{ICONS[task?.priority]}</span>
                  <span className='uppercase'>{task?.priority} Priority</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={clsx(
                    "w-4 h-4 rounded-full",
                    TASK_TYPE[task.stage]
                  )} />
                  <span className='text-black uppercase'>{task?.stage}</span>
                </div>
              </div>

              {/* Dates Section */}
              <div className='space-y-4 p-4 border rounded-lg bg-gray-50'>
                <div className='flex items-center gap-2 text-gray-500 font-medium'>
                  <MdCalendarToday className="text-gray-600" />
                  <span className='mr-2'>Created:</span>
                  {formattedDate}
                </div>
                <div className='flex items-center gap-2 text-gray-500 font-medium'>
                  <MdCalendarToday className="text-gray-600" />
                  <span className='mr-2'>Due Date:</span>
                  <span className={clsx(
                    moment().isAfter(task?.dueDate) && task?.stage !== 'completed' ? 'text-red-600' : 'text-gray-700'
                  )}>
                    {formattedDueDate}
                  </span>
                </div>
              </div>

              {/* Task Stats */}
              <div className='flex items-center gap-8 p-4 border-y border-gray-200'>
                <div className='space-x-2'>
                  <span className='font-semibold'>Assets:</span>
                  <span>{task?.files?.length || 0}</span>
                </div>
                <span className='text-gray-400'>|</span>
                <div className='space-x-2'>
                  <span className='font-semibold'>Sub-Tasks:</span>
                  <span>{subtasks.length}</span>
                </div>
              </div>

              {/* Team Members Section - Only show if team exists */}
              {task?.team && teamMembers.length > 0 && (
                <MembersList 
                  members={teamMembers} 
                  title="TEAM MEMBERS" 
                  icon={<FaUsers className="text-blue-600" />}
                />
              )}

              {/* Individual Members Section - Only show if individual members exist */}
              {individualMembers.length > 0 && (
                <MembersList 
                  members={individualMembers} 
                  title="INDIVIDUAL MEMBERS" 
                  icon={<FaUser className="text-green-600" />}
                />
              )}

              {/* Subtasks Section */}
              <div className='space-y-4 py-6'>
                <p className='text-gray-500 font-semibold text-sm'>SUB-TASKS</p>
                <div className='space-y-8'>
                  {subtasks.map((subtask) => (
                    <div key={subtask?._id} className='flex gap-3'>
                      <div className='w-10 h-10 flex items-center justify-center rounded-full bg-violet-50'>
                        <MdTaskAlt className='text-violet-600' size={26} />
                      </div>
                      <div className='space-y-1'>
                        <div className='flex gap-2 items-center'>
                          <span className='text-sm text-gray-500'>
                            {moment(subtask?.date).format('MMM D, YYYY')}
                          </span>
                          {subtask?.tag && (
                            <span className='px-2 py-0.5 text-sm rounded-full bg-violet-100 text-violet-700 font-semibold'>
                              {subtask.tag}
                            </span>
                          )}
                        </div>
                        <p className='text-gray-700'>{subtask?.title}</p>
                        <p className='text-gray-500 text-sm'>{subtask?.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Assets Management Component */}
            <AssetManagement taskId={id} refetchTask={refetchTask} />
          </div>
        ) : (
          <Activities 
            activity={task?.activities} 
            id={id} 
            refetch={refetchTask} 
          />
        )}
      </Tabs>
    </div>
  );
};

export default TaskDetails;