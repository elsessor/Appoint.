import { generateStreamToken } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    // ✅ Use _id (MongoDB) not id
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID not found" });
    }
    
    console.log("📝 Generating token for user:", userId);
    
    const token = generateStreamToken(userId);

    if (!token) {
      throw new Error("Token generation failed");
    }

    res.status(200).json({ token });
  } catch (error) {
    console.error("❌ Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}