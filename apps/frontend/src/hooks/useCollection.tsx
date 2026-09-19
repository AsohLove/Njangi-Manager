"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGroups, getGroupbyId, createGroup } from "@/lib/api-client";

export function useGroups() {
  return useQuery({queryKey: ["groups"], queryFn: getGroups});
}

export function useGroup(id: number) {
  return useQuery({queryKey: ["group", id], queryFn: () => getGroupbyId(id)});
}

export function useCreateGroup() {
  return useInvalidatingCreate(createGroup, ["groups"]);
}

function useInvalidatingCreate<TPayload, TResult>(
  mutationFn: (payload: TPayload) => Promise<TResult>,
  queryKey: readonly unknown[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

function useInvalidatingDelete(
  mutationFn: (id: string | number) => Promise<unknown>,
  queryKey: readonly unknown[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}