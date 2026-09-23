import axios, { AxiosError } from "axios";
import type { registerDto, loginDto, groupDto, Payment } from "@/types/entities";

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

    const backendMessage = error.response?.data?.message;
    const customMessage = Array.isArray(backendMessage)
      ? backendMessage.join(", ")
      : (backendMessage ??
        error.message ??
        "Something went wrong while contacting the API.");

    error.message = customMessage;

    return Promise.reject(error);
  },
);

function toFormData(
  payload: Record<string, string | number | File | null | undefined>,
) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export async function loginAdmin(credentials: loginDto) {
  const response = await apiClient.post("/auth/login", credentials);
  const user = response.data.user;

  if (typeof window !== "undefined" && user) {
    window.localStorage.setItem("treasurer_user", JSON.stringify(user));
  }

  return user;
}

export async function registerAdmin(data: registerDto) {
  const response = await apiClient.post("/auth/register", data);
  const user = response.data

  if (typeof window !== "undefined" && user) {
    window.localStorage.setItem("treasurer_user", JSON.stringify(user));
  }

  return user;
}

export async function logoutAdmin() {
  const response = await apiClient.post("/auth/logout");
  const user = response.data;

  if (typeof window !== "undefined" && user) {
    window.localStorage.setItem("treasurer_user", JSON.stringify(user));
  }

  return user;
}

export async function getGroups() {
  const response = await apiClient.get("/groups");
  return response.data;
}

export async function getGroupbyId(id: number) {
  const response = await apiClient.get(`/groups/${id}`);
  return response.data;
}

export async function shareGroupCode(id: number) {
  const response = await apiClient.post(`/groups/${id}/share-code`);
  return response.data;
}

export async function createGroup(payload: groupDto | FormData) {
  const body = payload instanceof FormData ? payload : payload;

  const response = await apiClient.post("/groups", body);
  return response.data;
}

export async function createPayment({
  roundId,
  payload,
}: {
  roundId: number;
  payload: Payment | FormData;
}) {
  const body = payload instanceof FormData ? payload : payload;
  const response = await apiClient.post(`/rounds/${roundId}/payments`, body);
  return response.data;
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("treasurer_user");
  try {
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function getGroupMembers(groupId: number) {
  const response = await apiClient.get(`/groups/${groupId}/members`);
  return response.data;
}

export async function createMember(groupId: number, payload: { full_name: string; phone?: string }) {
  const response = await apiClient.post(`/groups/${groupId}/members`, payload);
  return response.data;
}

export async function deleteMember(memberId: number) {
  const response = await apiClient.delete(`/members/${memberId}`);
  return response.data;
}

export async function createPosition(groupId: number, memberId: number) {
  const response = await apiClient.post(`/groups/${groupId}/positions`, { member_id: memberId });
  return response.data;
}

export async function deletePosition(positionId: number) {
  const response = await apiClient.delete(`/positions/${positionId}`);
  return response.data;
}

export async function updatePositionsOrder(
  groupId: number,
  positionIds: number[],
) {
  await apiClient.put(`/groups/${groupId}/positions/order`, {
    position_ids: positionIds,
  });
}

export async function getSharebyCode(code:string) {
 const response = await apiClient.get(`/share/${code}`)
 return response.data;
}