import mongoose from 'mongoose';
import Notice from "../models/notification.js";
import Task from "../models/task.js";
import User from "../models/user.js";
import { ObjectId } from 'mongodb';

// Helper function to validate file existence
const validateFileExistence = async (fileIds) => {
  if (!fileIds || !Array.isArray(fileIds)) {
    return true;
  }
  
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  
  const filesCollection = db.collection('uploads.files'); // Updated to match your collection name
  const missingFiles = [];
  
  for (const fileId of fileIds) {
    try {
      // Skip null/undefined fileIds
      if (!fileId) {
        continue;
      }

      if (!ObjectId.isValid(fileId)) {
        console.warn(`Skipping invalid file ID format: ${fileId}`);
        continue;
      }
      
      const file = await filesCollection.findOne({ 
        _id: new ObjectId(fileId) 
      });
      
      if (!file) {
        missingFiles.push(fileId);
      }
    } catch (error) {
      console.error(`Error validating file ${fileId}:`, error);
      // Continue validation instead of throwing error
      continue;
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(`Files not found: ${missingFiles.join(', ')}`);
  }
  
  return true;
};

export const createTask = async (req, res) => {
  try {
    const { userId } = req.user;
    const { 
      title,
      team, 
      members, 
      stage, 
      date, 
      dueDate, // Add dueDate to destructured parameters
      priority, 
      assets, 
      subTasks 
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Title is required"
      });
    }
    // Validate dueDate
    if (!dueDate) {
      return res.status(400).json({
        status: false,
        message: "Due date is required"
      });
    }

    // Validate members assignment
    if ((!team?.members || team.members.length === 0) && (!members || members.length === 0)) {
      return res.status(400).json({
        status: false,
        message: "At least one member must be assigned (either team or individual)"
      });
    }

    // Validate dates
    const startDate = new Date(date || new Date());
    const endDate = new Date(dueDate);
    if (endDate < startDate) {
      return res.status(400).json({
        status: false,
        message: "Due date cannot be earlier than start date"
      });
    }

    // Format assets if provided
    const formattedAssets = assets?.map(asset => ({
      type: "ObjectId",
      value: asset
    })) || [];

    // Format subTasks if provided
    const formattedSubTasks = subTasks?.map(task => ({
      title: task.title,
      date: task.date || new Date(),
      tag: task.tag,
      dueDate: task.dueDate // Add dueDate for subtasks if needed
    })) || [];

    // Prepare base task data
    const taskData = {
      title,
      date: startDate,
      dueDate: endDate, // Add dueDate to task data
      priority: (priority || 'normal').toLowerCase(),
      stage: (stage || 'todo').toLowerCase(),
      activities: [{
        type: "assigned",
        activity: `Task assigned by ${userId}`,
        date: new Date(),
        by: userId
      }],
      subTasks: formattedSubTasks,
      isTrashed: false,
      assets: formattedAssets
    };

    // Add team information if provided
    if (team?._id && team?.members?.length > 0) {
      taskData.team = {
        _id: team._id,
        name: team.name,
        members: team.members.map(member => ({
          _id: member._id,
          name: member.name,
          email: member.email,
          avatar: member.avatar || "",
          title: member.title || ""
        })),
        createdBy: team.createdBy
      };
    }

    // Add individual members if provided
    if (members?.length > 0) {
      taskData.members = members.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        avatar: member.avatar || "",
        title: member.title || ""
      }));
    }

    // Create task
    const task = await Task.create(taskData);

    // Create notifications for all assigned members
    const allMembers = [...(team?.members || []), ...(members || [])];
    const uniqueMembers = Array.from(new Set(allMembers.map(m => m._id)))
      .map(id => allMembers.find(m => m._id === id));

    const notificationText = `New task "${title}" has been assigned to you${
      uniqueMembers.length > 1 ? ` and ${uniqueMembers.length - 1} others` : ''
    }. Priority: ${priority}. Due: ${endDate.toLocaleDateString()}`;

    await Notice.create({
      team: uniqueMembers.map(member => member._id),
      text: notificationText,
      task: task._id,
      notiType: 'alert',
      isRead: []
    });

    return res.status(200).json({
      status: true,
      task: task.toObject(),
      message: "Task created successfully"
    });

  } catch (error) {
    console.error('Task creation error:', error);
    return res.status(400).json({
      status: false,
      message: error.message || 'Failed to create task'
    });
  }
};

export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const originalTask = await Task.findById(id);
    
    if (!originalTask) {
      return res.status(404).json({ 
        status: false, 
        message: "Original task not found" 
      });
    }

    // Create new task with properly structured team object
    const newTask = await Task.create({
      title: originalTask.title + " - Duplicate",
      team: {
        _id: originalTask.team._id,
        name: originalTask.team.name,
        members: originalTask.team.members,
        createdBy: originalTask.team.createdBy
      },
      subTasks: originalTask.subTasks,
      assets: originalTask.assets,
      priority: originalTask.priority,
      stage: originalTask.stage,
      date: originalTask.date,
      dueDate: originalTask.dueDate,
      members: originalTask.members,
      activities: [{
        type: "assigned", // Changed from "duplicated" to "assigned"
        activity: `Task duplicated and assigned by ${req.user.userId}`,
        date: new Date(),
        by: req.user.userId
      }]
    });

    // Create notification for all assigned members
    const allMembers = [
      ...(originalTask.team?.members || []), 
      ...(originalTask.members || [])
    ];
    const uniqueMembers = Array.from(new Set(allMembers.map(m => m._id)))
      .map(id => allMembers.find(m => m._id === id));

    const notificationText = `New task "${newTask.title}" has been duplicated and assigned to you${
      uniqueMembers.length > 1 ? ` and ${uniqueMembers.length - 1} others` : ''
    }. Priority: ${newTask.priority}. Due: ${new Date(newTask.dueDate).toLocaleDateString()}`;

    await Notice.create({
      team: uniqueMembers.map(member => member._id),
      text: notificationText,
      task: newTask._id,
      notiType: 'alert',
      isRead: []
    });

    res.status(200).json({ 
      status: true, 
      message: "Task duplicated successfully.",
      task: newTask 
    });
  } catch (error) {
    console.error('Task duplication error:', error);
    return res.status(400).json({ 
      status: false, 
      message: error.message || 'Failed to duplicate task' 
    });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { type, activity } = req.body;

    const task = await Task.findById(id);

    const data = {
      type,
      activity,
      by: userId,
    };

    task.activities.push(data);

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Activity posted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    
    console.log('User ID:', userId);
    console.log('Is Admin:', isAdmin);

    const baseQuery = {
      isTrashed: { $ne: true }
    };
    
    console.log('Base Query:', JSON.stringify(baseQuery, null, 2));

    // Fetch tasks with debug logging
    const allTasks = await Task.find(baseQuery)
      .populate({
        path: "team.members",
        select: "name role title email _id"
      })
      .sort({ createdAt: -1 });

    console.log('Found tasks:', allTasks.length);
    
    // DEBUG: Log first task structure
    if (allTasks.length > 0) {
      console.log('Sample task structure:', JSON.stringify(allTasks[0], null, 2));
    }

    // Calculate task statistics with debugging
    const taskStats = allTasks.reduce((result, task) => {
      const stage = (task.stage || '').toLowerCase();
      console.log('Processing task:', task._id, 'Stage:', stage);
      
      result[stage] = (result[stage] || 0) + 1;
      result.total = (result.total || 0) + 1;
      return result;
    }, {});

    console.log('Task stats:', taskStats);

    // Calculate priority statistics with debugging
    const priorityStats = allTasks.reduce((result, task) => {
      const priority = (task.priority || '').toLowerCase();
      console.log('Processing priority:', task._id, 'Priority:', priority);
      
      result[priority] = (result[priority] || 0) + 1;
      return result;
    }, {});

    console.log('Priority stats:', priorityStats);

    // Format graph data
    const graphData = Object.entries(priorityStats).map(([name, total]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      total
    }));

    console.log('Graph data:', graphData);

    // Get active users
    const users = await User.find({ isActive: true })
      .select("name title role isAdmin createdAt isActive")
      .limit(10)
      .sort({ createdAt: -1 });

    console.log('Active users found:', users.length);

    // Prepare response
    const statsObject = {
      status: true,
      message: "Successfully retrieved dashboard statistics",
      totalTasks: allTasks.length,
      last10Task: allTasks.slice(0, 10),
      users: isAdmin ? users : [],
      userTasks: {
        total: taskStats.total || 0,
        completed: taskStats.completed || 0,
        "in progress": taskStats["in progress"] || 0,
        todo: taskStats.todo || 0
      },
      graphData
    };

    console.log('Final response structure:', {
      totalTasks: statsObject.totalTasks,
      last10TaskCount: statsObject.last10Task.length,
      userTasksStats: statsObject.userTasks,
      graphDataLength: statsObject.graphData.length
    });

    res.status(200).json(statsObject);
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    console.error('Error stack:', error.stack);
    return res.status(400).json({ 
      status: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getTasks = async (req, res) => {
  try {
    const { strQuery, isTrashed = 'false', search } = req.query;
    const { userId, isAdmin } = req.user;

    // Build base query
    let query = {
      isTrashed: isTrashed === 'true',
    };

    // Add stage filter if provided and not 'all'
    if (strQuery && strQuery !== 'all') {
      query.stage = strQuery.toLowerCase();
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'team.name': { $regex: search, $options: 'i' } }
      ];
    }

    // For non-admin users, filter by team membership
    if (!isAdmin) {
      query['team.members'] = {
        $elemMatch: {
          '_id': userId // Match the embedded document's _id field
        }
      };
    }

    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('UserID:', userId);

    // Execute the query with proper population
    const tasks = await Task.find(query)
      .populate({
        path: 'team._id',
        select: 'name description'
      })
      .populate({
        path: 'team.createdBy',
        select: 'name email'
      })
      .populate({
        path: 'activities.by',
        select: 'name email'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Validate and clean the response data
    const validatedTasks = tasks.map(task => {
      // Ensure team members array exists and is valid
      const validMembers = Array.isArray(task.team?.members) 
        ? task.team.members.filter(member => 
            member && member._id && member.name
          )
        : [];

      // Ensure activities array exists and is valid
      const validActivities = Array.isArray(task.activities)
        ? task.activities.filter(activity => 
            activity && activity.type && activity.activity
          )
        : [];

      // Clean and validate subtasks
      const validSubtasks = Array.isArray(task.subTasks)
        ? task.subTasks.filter(subtask => 
            subtask && subtask.title
          )
        : [];

      return {
        ...task,
        team: {
          ...task.team,
          members: validMembers
        },
        activities: validActivities,
        subTasks: validSubtasks
      };
    });

    return res.status(200).json({
      status: true,
      tasks: validatedTasks,
      count: validatedTasks.length,
      metadata: {
        filters: {
          stage: strQuery || 'all',
          isTrashed: isTrashed === 'true',
          hasSearch: !!search
        },
        userRole: isAdmin ? 'admin' : 'member'
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    
    // Enhanced error handling with specific messages
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.name === 'CastError') {
      errorMessage = 'Invalid ID format in the request';
      statusCode = 400;
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Invalid data format';
      statusCode = 400;
    }

    return res.status(statusCode).json({
      status: false,
      message: errorMessage,
      error: {
        type: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.user;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid task ID format'
      });
    }

    const query = { _id: new ObjectId(id) };
    
    // For non-admin users, verify they are a team member
    if (!isAdmin) {
      query['team.members._id'] = new ObjectId(userId);
    }

    const task = await Task.findOne(query)
      .populate({
        path: 'team.members',
        select: 'name title email _id'
      })
      .populate({
        path: 'activities.by',
        select: 'name'
      });

    if (!task) {
      return res.status(404).json({
        status: false,
        message: 'Task not found or access denied'
      });
    }

    return res.status(200).json({
      status: true,
      task
    });

  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({
      status: false,
      message: error.message || 'Failed to fetch task',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Validate taskId format
    if (!ObjectId.isValid(taskId)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid task ID format'
      });
    }

    // Find task and handle non-existent task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        status: false,
        message: 'Task not found'
      });
    }

    // Handle case where task has no assets
    if (!task.assets || task.assets.length === 0) {
      return res.status(200).json({
        status: true,
        files: []
      });
    }

    // Ensure database connection exists
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');

    // Use Promise.all for efficient parallel file fetching
    const filePromises = task.assets.map(async (fileId) => {
      try {
        // Validate fileId format
        if (!ObjectId.isValid(fileId)) {
          console.warn(`Invalid file ID format: ${fileId}`);
          return null;
        }

        const file = await filesCollection.findOne({ 
          _id: new ObjectId(fileId) 
        });

        if (!file) {
          console.warn(`File not found: ${fileId}`);
          return null;
        }

        return {
          id: file._id,
          filename: file.filename,
          originalname: file.metadata?.originalname || file.filename,
          size: file.length,
          uploadDate: file.uploadDate,
          contentType: file.contentType
        };
      } catch (error) {
        console.error(`Error fetching file ${fileId}:`, error);
        return null;
      }
    });

    const files = (await Promise.all(filePromises)).filter(file => file !== null);

    return res.status(200).json({
      status: true,
      files
    });

  } catch (error) {
    console.error('Get task files error:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error while retrieving task files',
      error: error.message
    });
  }
};


export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;

    const { id } = req.params;

    const newSubTask = {
      title,
      date,
      tag,
    };

    const task = await Task.findById(id);

    task.subTasks.push(newSubTask);

    await task.save();

    res.status(200)
    .json({ status: true, message: "SubTask added successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
// Update the updateTask controller to handle file updates
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;

    // Validate that all new asset files exist in GridFS
    if (assets && assets.length > 0) {
      await validateFileExistence(assets);
    }

    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        status: false,
        message: 'Task not found'
      });
    }

    // Update task fields
    task.title = title;
    task.date = date;
    task.priority = priority.toLowerCase();
    task.assets = assets || [];
    task.stage = stage.toLowerCase();
    task.team = team;

    await task.save();

    res.status(200).json({ 
      status: true, 
      message: "Task updated successfully.",
      task
    });
  } catch (error) {
    console.error('Task update error:', error);
    return res.status(400).json({ 
      status: false, 
      message: error.message 
    });
  }
};


export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found"
      });
    }

    // Update task to trashed state
    task.isTrashed = true;
    
    // Add activity log for trashing with validated type
    task.activities.push({
      type: "trashed", // Now this is a valid enum value
      activity: `Task moved to trash`,
      by: userId,
      date: new Date()
    });

    await task.save();

    // Create notification for team members
    if (task.team && task.team.members) {
      await Notice.create({
        team: task.team.members.map(member => member._id),
        text: `Task "${task.title}" has been moved to trash`,
        task: task._id,
        notiType: 'alert',
        isRead: []
      });
    }

    res.status(200).json({
      status: true,
      message: "Task moved to trash successfully",
      taskId: id
    });
  } catch (error) {
    console.error('Trash task error:', error);
    return res.status(400).json({ 
      status: false, 
      message: error.message || 'Error moving task to trash'
    });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;
    const { userId } = req.user;

    switch (actionType) {
      case "delete":
        await Task.findByIdAndDelete(id);
        return res.status(200).json({
          status: true,
          message: "Task permanently deleted"
        });

      case "deleteAll":
        const deletedCount = await Task.deleteMany({ isTrashed: true });
        return res.status(200).json({
          status: true,
          message: `${deletedCount.deletedCount} trashed tasks permanently deleted`
        });

      case "restore":
        const task = await Task.findById(id);
        if (!task) {
          return res.status(404).json({
            status: false,
            message: "Task not found"
          });
        }

        task.isTrashed = false;
        task.activities.push({
          type: "restored", // Using the validated enum value
          activity: `Task restored from trash`,
          by: userId,
          date: new Date()
        });

        await task.save();

        if (task.team && task.team.members) {
          await Notice.create({
            team: task.team.members.map(member => member._id),
            text: `Task "${task.title}" has been restored from trash`,
            task: task._id,
            notiType: 'alert',
            isRead: []
          });
        }

        return res.status(200).json({
          status: true,
          message: "Task restored successfully"
        });

      case "restoreAll":
        const result = await Task.updateMany(
          { isTrashed: true },
          { 
            $set: { isTrashed: false },
            $push: {
              activities: {
                type: "restored",
                activity: `Task restored from trash`,
                by: userId,
                date: new Date()
              }
            }
          }
        );

        return res.status(200).json({
          status: true,
          message: `${result.modifiedCount} tasks restored from trash`
        });

      default:
        return res.status(400).json({
          status: false,
          message: "Invalid action type"
        });
    }
  } catch (error) {
    console.error('Delete/Restore task error:', error);
    return res.status(400).json({ 
      status: false, 
      message: error.message || 'Error processing task action'
    });
  }
};
