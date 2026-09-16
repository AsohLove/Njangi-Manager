import axios, { AxiosError } from "axios";
import type { registerDto, loginDto, groupDto } from "@/types/entities";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Tells the browser to automatically manage HTTP-only cookies
  timeout: 40_000,
  headers: {
    Accept: "application/json",
  },
});


apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: unknown }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isAuthPage =
        currentPath === "/login" || currentPath === "/register";

      if (!isAuthPage) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        return Promise.reject(error);
      }
    }

    const customMessage =
      error.response?.data?.message ??
      error.message ??
      "Something went wrong while contacting the API.";

    error.message = customMessage;

    return Promise.reject(error);
  },
);


export async function loginAdmin(credentials: loginDto) {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
}

export async function registerAdmin(data: registerDto) {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
}

export async function logoutAdmin() {
  const response = await apiClient.post("/auth/logout");
  return response.data;
}

export async function createGroup(data: groupDto) {
  const response = await apiClient.post("/groups", data);
  return response.data;
}
