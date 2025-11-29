import mongoose from "mongoose";

const meetingMinutesSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  title: {
    type: String,
    default: "Meeting"
  },
  
  startTime: Date,
  endTime: Date,
  duration: Number,
  
  transcript: {
    type: String,
    default: ""
  },
  
  summary: {
    type: String,
    default: ""
  },
  
  keyPoints: [String],
  
  decisions: [{
    decision: String,
    timestamp: Date
  }],
  
  actionItems: [{
    task: String,
    assignedTo: String,
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const MeetingMinutes = mongoose.model("MeetingMinutes", meetingMinutesSchema);

export default MeetingMinutes;
