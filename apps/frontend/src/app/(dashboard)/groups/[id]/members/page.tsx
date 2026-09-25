"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  createPosition,
  deleteMember,
  deletePosition,
  getGroupbyId,
  createCycle,
  createRound,
  updatePositionsOrder,
} from "@/lib/api-client";
import type { Member, Position } from "@/types/entities";
import { useState } from "react";

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export default function MemberPage() {
  const params = useParams();
  const groupId = Number(params.id);
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupbyId(groupId),
    enabled: Number.isInteger(groupId),
  });

  const shuffleMutation = useMutation({
    mutationFn: (positionIds: number[]) =>
      updatePositionsOrder(groupId, positionIds),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const cycleMutation = useMutation({
    mutationFn: () => createCycle(groupId),
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
    },
    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const roundMutation = useMutation({
    mutationFn: () => {
      const cycleId = group?.activeCycle?.id;

      if (!cycleId) {
        throw new Error("Start a cycle before opening a round");
      }

      return createRound(
        cycleId,
        group.orderMode === "fixed" ? "auto" : "app_draw",
      );
    },
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
    },
    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const positionMutation = useMutation({
    mutationFn: (memberId: number) => createPosition(groupId, memberId),

    onMutate: () => {
      setActionError(null);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
    },

    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: (positionId: number) => deletePosition(positionId),

    onMutate: () => {
      setActionError(null);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
    },

    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberId: number) => deleteMember(memberId),

    onMutate: () => {
      setActionError(null);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
    },

    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading members...</p>
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Unable to load members.</p>
      </div>
    );
  }

  const members: Member[] = group.members ?? [];
  const positions: Position[] = group.positions ?? [];

  const cycleStarted = Boolean(group.activeCycle);
  const roundOpen = Boolean(group.openRound);

  const orderedPositions = [...positions]
    .filter((position) => position.isActive)
    .sort(
      (a, b) =>
        (a.rotationOrder ?? a.payoutOrder ?? 999) -
        (b.rotationOrder ?? b.payoutOrder ?? 999),
    );

  const canEditMembers = !cycleStarted;
  const canShuffle = !cycleStarted && group.orderMode === "ballot";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-800 px-5 py-4 text-white">
        <div className="flex items-center gap-4">
          <Link href={`/groups/${groupId}`} className="text-2xl">
            ‹
          </Link>

          <div>
            <h1 className="text-lg font-bold">Members & positions</h1>
            <p className="text-sm text-emerald-100">
              {group.name} · {members.length} members ·{" "}
              {orderedPositions.length} positions
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {actionError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}
        {cycleStarted && (
          <div className="mb-4 rounded-md border-l-4 border-amber-600 bg-amber-50 px-4 py-3">
            <p className="text-sm text-slate-700">
              The cycle has started. Members, positions and the order are locked
              until it ends.
            </p>
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Payout order</h2>

          <div>
            {orderedPositions.length === 0 ? (
              <div className="rounded-md bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No positions yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add a position to a member to create the payout order.
                </p>
              </div>
            ) : (
              orderedPositions.map((position, index) => {
                const member = members.find(
                  (item) => item.id === position.memberId,
                );

                if (!member) return null;

                const memberPositions = orderedPositions.filter(
                  (item) => item.memberId === member.id,
                );

                const memberPositionNumber =
                  memberPositions.findIndex((item) => item.id === position.id) +
                  1;

                return (
                  <div
                    key={position.id}
                    className="flex items-center gap-3 border-b border-slate-200 py-3 last:border-b-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-800">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {member.fullName}
                      </p>

                      {memberPositions.length > 1 && (
                        <p className="text-xs text-slate-500">
                          position {memberPositionNumber} of{" "}
                          {memberPositions.length}
                        </p>
                      )}
                    </div>

                    {position.payoutStatus === "COLLECTED" && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                        COLLECTED
                      </span>
                    )}

                    {position.payoutStatus === "THIS ROUND" && (
                      <span className="rounded-full bg-emerald-800 px-2 py-1 text-xs font-semibold text-white">
                        THIS ROUND
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              disabled={!canShuffle || shuffleMutation.isPending}
              onClick={() => {
                const shuffledPositionIds = shuffle(
                  orderedPositions.map((position) => position.id),
                );

                shuffleMutation.mutate(shuffledPositionIds);
              }}
              className="w-full rounded-md bg-slate-100 py-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {shuffleMutation.isPending ? "Shuffling..." : "Shuffle order"}
            </button>

            <button
              type="button"
              disabled={cycleStarted || cycleMutation.isPending}
              onClick={() => cycleMutation.mutate()}
              className="w-full rounded-md bg-emerald-800 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {cycleMutation.isPending ? "Starting cycle..." : "Start cycle"}
            </button>

            <button
              type="button"
              disabled={!cycleStarted || roundOpen || roundMutation.isPending}
              onClick={() => roundMutation.mutate()}
              className="w-full rounded-md bg-slate-900 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {roundMutation.isPending ? "Opening round..." : "Open round"}
            </button>

            <Link
              href={canEditMembers ? `/groups/${groupId}/members/new` : "#"}
              aria-disabled={!canEditMembers}
              className={`block w-full rounded-md bg-slate-100 py-3 text-center text-sm font-medium ${
                canEditMembers
                  ? "text-slate-700"
                  : "pointer-events-none text-slate-400"
              }`}
            >
              + Add member
            </Link>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Phone numbers are stored here but never shown on the share page.
          </p>
        </section>
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Members</h2>

          <div>
            {members.length === 0 ? (
              <div className="rounded-md bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No members yet
                </p>

                {canEditMembers && (
                  <Link
                    href={`/groups/${groupId}/members/new`}
                    className="mt-3 inline-block text-sm font-medium text-emerald-800"
                  >
                    + Add the first member
                  </Link>
                )}
              </div>
            ) : (
              members.map((member) => {
                const memberPositions = positions.filter(
                  (position) =>
                    position.memberId === member.id && position.isActive,
                );

                return (
                  <div
                    key={member.id}
                    className="border-b border-slate-200 py-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {member.fullName}
                        </p>

                        {memberPositions.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {memberPositions.map((position) => (
                              <div
                                key={position.id}
                                className="flex items-center justify-between gap-3"
                              >
                                <p className="text-xs text-slate-500">
                                  Position #{position.rotationOrder ?? "—"}
                                </p>

                                {canEditMembers && (
                                  <button
                                    type="button"
                                    disabled={deletePositionMutation.isPending}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Remove this position from the group?",
                                        )
                                      ) {
                                        deletePositionMutation.mutate(
                                          position.id,
                                        );
                                      }
                                    }}
                                    className="text-xs font-medium text-red-600 cursor-pointer disabled:text-slate-400"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            No positions
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {canEditMembers && (
                          <>
                            <button
                              type="button"
                              disabled={positionMutation.isPending}
                              onClick={() => positionMutation.mutate(member.id)}
                              className="text-sm font-medium text-emerald-800 disabled:text-slate-400"
                            >
                              + Position
                            </button>

                            <button
                              type="button"
                              disabled={deleteMemberMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${member.fullName} from this group?`,
                                  )
                                ) {
                                  deleteMemberMutation.mutate(member.id);
                                }
                              }}
                              className="text-sm font-medium text-red-600 disabled:text-slate-400"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
