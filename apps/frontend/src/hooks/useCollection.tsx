"use client";

import { useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  getGroups,
  getGroupbyId,
  createGroup,
  getSharebyCode,
  createPayment,
  updatePayment,
  getFineRules,
  createFineRule,
} from "@/lib/api-client";
import { groupDto, Payment, Rule, UpdatePayment } from "@/types/entities";

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

export function useShare(code: string) {
  return useQuery({
    queryKey: ["share", code],
    queryFn: () => getSharebyCode(code),
    enabled: !!code,
  })
}

export function useFineRules(id:number){
  return useQuery({
    queryKey: ["fine-rules", id],
    queryFn: () => getFineRules(id),
    enabled: !!id,
  })
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

export function useCreatePayment(groupId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roundId,
      payload,
    }: {
      roundId: number;
      payload: Payment | FormData;
    }) => createPayment({ roundId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["group"] });
      }
    },
  });
}

export function useUpdatePayment(groupId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: number;
      payload: UpdatePayment;
    }) => updatePayment(paymentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["group"] });
      }
    },
  });
}

export function useCreateRule(groupId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Rule | FormData) =>
      createFineRule(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fine-rules", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
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