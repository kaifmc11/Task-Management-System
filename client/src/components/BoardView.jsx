import React from "react";
import TaskCard from "./TaskCard";

const BoardView = ({ tasks = [], filter }) => {
  const filteredTasks = tasks.filter((task) => {
    if (filter === "todo") return task.stage === 'todo';
    if (filter === "in progress") return task.stage === 'in progress';
    if (filter === "completed") return task.stage === 'completed';
    return true; 
  });

  if (filter) {
    // For specific status, display tasks horizontally
    return (
      <div className='w-full py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {filteredTasks.map((task, index) => (
          <TaskCard task={task} key={index} />
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full text-center">No tasks available.</div>
        )}
      </div>
    );
  } else {
    return (
      <div className='w-full py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
        <div className="space-y-4">
          {filteredTasks.filter(task => task.stage === 'todo').map((task, index) => (
            <TaskCard task={task} key={index} />
          ))}
          {filteredTasks.filter(task => task.stage === 'todo').length === 0 && (
            <div className="text-center">No todo tasks available.</div>
          )}
        </div>
        <div className="space-y-4">
          {filteredTasks.filter(task => task.stage === 'in progress').map((task, index) => (
            <TaskCard task={task} key={index} />
          ))}
          {filteredTasks.filter(task => task.stage === 'in progress').length === 0 && (
            <div className="text-center">No in-progress tasks available.</div>
          )}
        </div>
        <div className="space-y-4">
          {filteredTasks.filter(task => task.stage === 'completed').map((task, index) => (
            <TaskCard task={task} key={index} />
          ))}
          {filteredTasks.filter(task => task.stage === 'completed').length === 0 && (
            <div className="text-center">No completed tasks available.</div>
          )}
        </div>
      </div>
    );
  }
};

export default BoardView;