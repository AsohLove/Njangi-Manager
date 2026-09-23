"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  createPosition,
  deletePosition,
  getGroupbyId,
  updatePositionsOrder,
} from "@/lib/api-client";
import type { GroupMemberProps, PositionProps } from "@/types/entities";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  const positionMutation = useMutation({
    mutationFn: (memberId: number) => createPosition(groupId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: (positionId: number) => deletePosition(positionId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
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

  const members: GroupMemberProps[] = group.members ?? [];
  const positions: PositionProps[] = group.positions ?? [];
  const collectedIds: number[] = group.collectedPositionIds ?? [];

  const cycleStarted = Boolean(group.activeCycle);

  const orderedPositions = [...positions]
    .filter((position) => position.isActive)
    .sort((a, b) => (a.rotationOrder ?? 999) - (b.rotationOrder ?? 999));

  const canEditMembers = !cycleStarted;
  const canShuffle = !cycleStarted && group.orderMode === "fixed";

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
            {orderedPositions.map((position, index) => {
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

              const hasCollected = collectedIds.includes(position.id);
              const isCollectingThisRound =
                position.id === group.openRound?.collectorPositionId;

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

                  {hasCollected && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                      COLLECTED
                    </span>
                  )}

                  {isCollectingThisRound && (
                    <span className="rounded-full bg-emerald-800 px-2 py-1 text-xs font-semibold text-white">
                      THIS ROUND
                    </span>
                  )}
                </div>
              );
            })}
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
            {members.map((member) => {
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
                                Position {position.rotationOrder ?? "—"}
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

                    {canEditMembers && (
                      <button
                        type="button"
                        disabled={positionMutation.isPending}
                        onClick={() => positionMutation.mutate(member.id)}
                        className="shrink-0 text-sm cursor-pointer font-medium text-emerald-800 disabled:text-slate-400"
                      >
                        + Position
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
