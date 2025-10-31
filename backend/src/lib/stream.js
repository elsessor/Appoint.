import { StreamChat } from "stream-chat"
import "dotenv/config"

const apiKey = process.env.STREAM_API_KEY  // Changed from STEAM to STREAM
const apiSecret = process.env.STREAM_API_SECRET  // Changed from STEAM to STREAM

if (!apiKey || !apiSecret) {
    throw new Error("Stream API key or Secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUsers([userData]);   
        return userData;
    } catch (error) {
        console.error("Error upserting Stream user:", error);
    }
};

export const generateStreamToken = (userId) => {
    try {
        const userIdStr = userId.toString();
        return streamClient.createToken(userIdStr);
    } catch (error) {
        console.error("Error generating Stream token:", error);
    }
};
