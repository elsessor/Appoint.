import Notification from "../models/Notification.js";

export async function getNotifications(req, res) {
  try {
    const userId = req.user._id.toString();

    const notifications = await Notification.find({ recipientId: userId })
      .populate("senderId", "fullName profilePic")
      .populate("appointmentId")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error in getNotifications controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const notification = await Notification.findOne({
      _id: id,
      recipientId: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error in markAsRead controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id.toString();

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error in markAllAsRead controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createNotification(data) {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification", error.message);
    throw error;
  }
}
  
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const notification = await Notification.findOne({
      _id: id,
      recipientId: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNotification controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}