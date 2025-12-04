import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getDashboardStats(req, res) {
  try {
    const [totalUsers, totalAdmins, totalAppointments, totalNotifications, totalFriendRequests] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "admin" }),
        Appointment.countDocuments(),
        Notification.countDocuments(),
        FriendRequest.countDocuments(),
      ]);

    const recentUsers = await User.find()
      .select("fullName email role isOnboarded createdAt profilePic")
      .sort({ createdAt: -1 })
      .limit(6);

    const recentAppointments = await Appointment.find()
      .populate("userId", "fullName profilePic")
      .populate("friendId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      stats: {
        totalUsers,
        totalAdmins,
        totalAppointments,
        totalNotifications,
        totalFriendRequests,
      },
      recentUsers,
      recentAppointments,
    });
  } catch (error) {
    console.error("Error in getDashboardStats controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (req.user._id.toString() === id && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin access" });
    }

    const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Role updated", user: updatedUser });
  } catch (error) {
    console.error("Error in updateUserRole controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Promise.all([
      FriendRequest.deleteMany({
        $or: [{ sender: id }, { recipient: id }],
      }),
      Appointment.deleteMany({
        $or: [{ userId: id }, { friendId: id }],
      }),
      Notification.deleteMany({
        $or: [{ senderId: id }, { recipientId: id }],
      }),
      User.updateMany({ friends: id }, { $pull: { friends: id } }),
      User.findByIdAndDelete(id),
    ]);

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Error in deleteUser controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAllAppointments(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status || "";

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate("userId", "fullName profilePic")
        .populate("friendId", "fullName profilePic")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query),
    ]);

    res.status(200).json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllAppointments controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Error in deleteAppointment controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

