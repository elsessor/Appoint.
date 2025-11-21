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

export async function getMyFriends() {
  try {
    const response = await axiosInstance.get("/user/friends");
    return response.data;
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
}

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
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};


export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function markNotificationsRead() {
  const response = await axiosInstance.put("/users/notifications/read");
  return response.data;
}

export const createAppointment = async (appointmentData) => {
  const response = await axiosInstance.post('/appointments', appointmentData);
  return response.data;
};

export const updateAppointment = async ({ id, ...appointmentData }) => {
  const response = await axiosInstance.put(`/appointments/${id}`, appointmentData);
  return response.data;
};

export const deleteAppointment = async (id) => {
  const response = await axiosInstance.delete(`/appointments/${id}`);
  return response.data;
};

export const getAppointments = async () => {
  const response = await axiosInstance.get('/appointments');
  return response.data;
};

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

