// hooks/useCurrentUser.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getStoredUser } from "@/lib/api-client";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
}

export function useCurrentUser(): UserProfile | null {
  const { data: user } = useQuery<UserProfile | null>({
    queryKey: ["auth-user"],
    // Query function falls back to localStorage if cache is empty
    queryFn: () => getStoredUser(),
    // Use stored user as initial data to prevent flash on initial load
    initialData: () => getStoredUser(),
    staleTime: Infinity, // Keeps the memory cache active as long as the session lives
  });

  return user ?? null;
}
