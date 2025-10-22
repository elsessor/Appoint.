import { axiosInstance } from "./axios";
import axios from "axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
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

export const getFriendRequests = async () => {
  const response = await axiosInstance.get("/user/friend-requests");
  return response.data;
};

export const acceptFriendRequest = async (requestId) => {
  const response = await axiosInstance.post(`/user/accept-friend-request/${requestId}/accept`);
  return response.data;
};