import mongoose from 'mongoose';
const { Schema } = mongoose;

const noticeSchema = new Schema({
  team: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  }],
  text: { 
    type: String,
    required: true 
  },
  task: { 
    type: Schema.Types.ObjectId, 
    ref: "Task",
    required: true 
  },
  notiType: { 
    type: String, 
    default: "alert", 
    enum: ["alert", "message"] 
  },
  isRead: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  }]
}, { 
  timestamps: true 
});

// Add indexes for better query performance
noticeSchema.index({ team: 1 });
noticeSchema.index({ task: 1 });
noticeSchema.index({ createdAt: -1 });

const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;