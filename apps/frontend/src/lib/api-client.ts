import axios, { AxiosError } from "axios";


export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
      Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {

})
