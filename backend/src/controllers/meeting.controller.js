// backend/src/controllers/meeting.controller.js
import MeetingMinutes from "../models/MeetingMinutes.js";
import { generateMeetingMinutes } from "../lib/gemini.js";

export async function createMeetingMinutes(req, res) {
  try {
    const { 
      callId, 
      targetUserId, 
      transcript,
      startTime,
      endTime,
      duration,
      title
    } = req.body;
    
    const currentUserId = req.user._id;
    
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ message: "Transcript is required" });
    }

    // Generate AI summary
    const aiResult = await generateMeetingMinutes(transcript);
    
    // Create meeting minutes
    const minutes = await MeetingMinutes.create({
      callId,
      participants: [currentUserId, targetUserId],
      title: title || "Meeting Summary",
      startTime,
      endTime,
      duration,
      transcript,
      summary: aiResult.summary,
      keyPoints: aiResult.keyPoints,
      decisions: aiResult.decisions.map(d => ({ decision: d })),
      actionItems: aiResult.actionItems,
      createdBy: currentUserId
    });
    
    await minutes.populate('participants', 'fullName profilePic email');
    
    res.status(201).json(minutes);
  } catch (error) {
    console.error("Error creating meeting minutes:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export async function getUserMeetingMinutes(req, res) {
  try {
    const userId = req.user._id;
    
    const minutes = await MeetingMinutes.find({
      participants: userId
    })
    .populate('participants', 'fullName profilePic')
    .sort({ createdAt: -1 });
    
    res.status(200).json(minutes);
  } catch (error) {
    console.error("Error fetching meeting minutes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMeetingMinutesById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const minutes = await MeetingMinutes.findOne({
      _id: id,
      participants: userId
    }).populate('participants', 'fullName profilePic');
    
    if (!minutes) {
      return res.status(404).json({ message: "Meeting minutes not found" });
    }
    
    res.status(200).json(minutes);
  } catch (error) {
    console.error("Error fetching meeting minutes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteMeetingMinutes(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const minutes = await MeetingMinutes.findOne({
      _id: id,
      participants: userId
    });
    
    if (!minutes) {
      return res.status(404).json({ message: "Meeting minutes not found" });
    }
    
    await MeetingMinutes.findByIdAndDelete(id);
    
    res.status(200).json({ message: "Meeting minutes deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting minutes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}