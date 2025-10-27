import { axiosInstance } from "./axios";
import axios from "axios";

const MOCK_USER_PAYLOAD = {
  user: {
    _id: "mock-id",
    fullName: "Demo User",
    email: "demo@example.com",
    isOnboarded: true,
    profilePic: "/default-profile.png",
    nativeLanguage: "English",
    learningLanguage: "Spanish",
  },
  token: "mock-token",
};

const FRIENDS_FALLBACK = [
  {
    _id: "friend-1",
    fullName: "Larry Agad",
    profilePic: "/larry.jpg",
    nativeLanguage: "English",
    learningLanguage: "Spanish",
    bio: "Loves conversation practice",
    location: "New York, USA",
  },
];

const RECOMMENDED_FALLBACK = [
  {
    _id: "rec-1",
    fullName: "Richard Sunas",
    profilePic: "/profile.jpg",
    nativeLanguage: "Spanish",
    learningLanguage: "English",
    bio: "Looking for speaking partners",
    location: "Madrid, Spain",
  },
];

const FRIEND_REQUESTS_FALLBACK = {
  incomingReqs: [],
  acceptedReqs: [],
};

function handleNetwork(fn, fallback) {
  return async function (...args) {
    try {
      return await fn(...args);
    } catch (err) {
      console.warn("API request failed, falling back to mock response:", err?.message || err);
      return fallback;
    }
  };
}

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", signupData);
  return response.data;
};

export const getAuthUser = async () => {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export const getFriendRequests = handleNetwork(async () => {
  const response = await axiosInstance.get("/user/friend-requests");
  return response.data;
}, FRIEND_REQUESTS_FALLBACK);

export const acceptFriendRequest = handleNetwork(async (requestId) => {
  const response = await axiosInstance.post(`/user/accept-friend-request/${requestId}/accept`);
  return response.data;
}, { success: true });

export const getUserFriends = handleNetwork(async () => {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}, FRIENDS_FALLBACK);

export const getRecommendedUsers = handleNetwork(async () => {
  const response = await axiosInstance.get("/users");
  return response.data;
}, RECOMMENDED_FALLBACK);

export const getOutgoingFriendReqs = handleNetwork(async () => {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}, []);

export const sendFriendRequest = handleNetwork(async (userId) => {
  const response = await axiosInstance.post(`/users/friend-requests/${userId}`);
  return response.data;
}, { success: true });