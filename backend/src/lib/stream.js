import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STEAM_API_KEY;
const apiSecret = process.env.STEAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("❌ Stream API key or Secret is missing");
  throw new Error("Stream credentials not configured");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
    throw error; // ✅ Throw error instead of swallowing it
  }
};

export const generateStreamToken = (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required for token generation");
    }
    
    const userIdStr = userId.toString();
    console.log("✅ Generating token for user:", userIdStr);
    
    const token = streamClient.createToken(userIdStr);
    
    if (!token) {
      throw new Error("Failed to generate token");
    }
    
    return token;
  } catch (error) {
    console.error("❌ Error generating Stream token:", error);
    throw error; // ✅ Throw error instead of returning undefined
  }
};