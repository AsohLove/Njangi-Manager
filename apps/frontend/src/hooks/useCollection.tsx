"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGroups, getGroupbyId, createGroup } from "@/lib/api-client";
import { groupDto } from "@/types/entities";

export function useGroups() {
  return useQuery({ queryKey: ["groups"], queryFn: getGroups });
}

export function useGroup(id: number) {
  return useQuery({
    queryKey: ["group", id],
    queryFn: () => getGroupbyId(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: groupDto | FormData) => createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
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