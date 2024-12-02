import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  priority: {
    type: String,
    default: "medium",
    enum: ["high", "medium", "normal", "low"],
    index: true
  },
  stage: {
    type: String,
    default: "todo",
    enum: ["todo", "in progress", "completed"],
    index: true
  },
  // Team assignment
  team: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: false,
      index: true
    },
    name: {
      type: String,
      required: function() {
        return !!this.team?._id;
      },
      trim: true
    },
    members: [{
      _id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      avatar: String,
      title: {
        type: String,
        trim: true
      }
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return !!this.team?._id;
      }
    }
  },
  // Individual assignment
  members: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    avatar: String,
    title: {
      type: String,
      trim: true
    }
  }],
  activities: [{
    type: {
      type: String,
      required: true,
      enum: [
        "assigned",
        "started",
        "in progress",
        "bug",
        "completed",
        "commented",
        "trashed",
        "restored",
        "edited",
        "deadline_updated",
        "priority_changed",
        "stage_changed",
        "file_added",
        "member_added",
        "member_removed"
      ]
    },
    activity: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  }],
  subTasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    date: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    },
    tag: {
      type: String,
      trim: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  isTrashed: {
    type: Boolean,
    default: false,
    index: true
  },
  trashedAt: {
    type: Date
  },
  trashedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  assets: [{
    _id: Schema.Types.ObjectId,
    filename: String,
    originalname: String,
    size: Number,
    contentType: String,
    uploadDate: Date,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: {
    type: Date
  },
  archivedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

// Compound indexes for common query patterns
taskSchema.index({ 'team._id': 1, 'stage': 1 });
taskSchema.index({ 'team._id': 1, 'isTrashed': 1 });
taskSchema.index({ 'team.members._id': 1, 'stage': 1 });
taskSchema.index({ 'members._id': 1, 'stage': 1 });
taskSchema.index({ 'dueDate': 1, 'stage': 1 });
taskSchema.index({ 'priority': 1, 'stage': 1 });
taskSchema.index({ createdAt: -1 });

// Validation middleware
taskSchema.pre('save', function(next) {
  // Trim title
  if (this.isModified('title')) {
    this.title = this.title.trim();
  }
  
  // Ensure either team or individual members are assigned, but not both
  const hasTeam = !!this.team?._id;
  const hasIndividualMembers = this.members?.length > 0;
  
  if (!hasTeam && !hasIndividualMembers) {
    return next(new Error('Task must be assigned to either a team or individual members'));
  }
  
  if (hasTeam && hasIndividualMembers) {
    return next(new Error('Task cannot be assigned to both team and individual members'));
  }
  
  // Validate dates
  if (this.dueDate && this.date && new Date(this.dueDate) < new Date(this.date)) {
    return next(new Error('Due date cannot be earlier than start date'));
  }
  
  next();
});

// Virtuals
taskSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  return this.dueDate.getTime() - Date.now();
});

taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return Date.now() > this.dueDate.getTime();
});

taskSchema.virtual('completionPercentage').get(function() {
  if (!this.subTasks || this.subTasks.length === 0) return 0;
  const completed = this.subTasks.filter(task => task.isCompleted).length;
  return Math.round((completed / this.subTasks.length) * 100);
});

// Methods
taskSchema.methods.isAssignedToUser = function(userId) {
  if (this.team?._id) {
    return this.team.members.some(member => member._id.toString() === userId.toString());
  }
  return this.members.some(member => member._id.toString() === userId.toString());
};

taskSchema.methods.addMember = function(member) {
  if (this.team?._id) {
    if (!this.team.members.some(m => m._id.toString() === member._id.toString())) {
      this.team.members.push(member);
    }
  } else {
    if (!this.members.some(m => m._id.toString() === member._id.toString())) {
      this.members.push(member);
    }
  }
};

taskSchema.methods.removeMember = function(memberId) {
  if (this.team?._id) {
    this.team.members = this.team.members.filter(m => m._id.toString() !== memberId.toString());
  } else {
    this.members = this.members.filter(m => m._id.toString() !== memberId.toString());
  }
};

// Statics
taskSchema.statics.findByMember = function(userId) {
  return this.find({
    $or: [
      { 'team.members._id': userId },
      { 'members._id': userId }
    ],
    isTrashed: false,
    isArchived: false
  });
};

taskSchema.statics.findOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    stage: { $ne: 'completed' },
    isTrashed: false,
    isArchived: false
  });
};

taskSchema.statics.findUpcomingDeadlines = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    dueDate: {
      $gte: new Date(),
      $lte: futureDate
    },
    stage: { $ne: 'completed' },
    isTrashed: false,
    isArchived: false
  });
};

const Task = mongoose.model("Task", taskSchema);

export default Task;