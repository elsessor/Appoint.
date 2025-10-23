import { axiosInstance } from "./axios";
import axios from "axios";


export async function getUserFriends () {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
};

export async function getRecommendedUsers () {
  const response = await axiosInstance.get("/users");
  return response.data;
};

export async function getOutgoingFriendReqs () {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
};

export async function sendFriendRequest (userId) {
  const response = await axiosInstance.post(`/users/friend-requests/${userId}`);
  return response.data;
};