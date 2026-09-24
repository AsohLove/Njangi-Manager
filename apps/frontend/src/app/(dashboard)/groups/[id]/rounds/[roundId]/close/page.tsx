"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { closeRound, getRound } from "@/lib/api-client";
import type { RoundDetails } from "@/types/entities";

export default function CloseRoundPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const groupId = Number(params.id);
  const roundId = Number(params.roundId);
  const [acknowledgeShortfall, setAcknowledgeShortfall] = useState(false);

  const {
    data: round,
    isLoading,
    isError,
  } = useQuery<RoundDetails>({
    queryKey: ["round", roundId],
    queryFn: () => getRound(roundId),
    enabled: Number.isInteger(roundId),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeRound(roundId, acknowledgeShortfall),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["round", roundId] });
      router.push(`/groups/${groupId}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Loading round...</p>
      </div>
    );
  }

  if (isError || !round) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <p className="text-sm font-medium text-red-600">
          Unable to load this round.
        </p>
      </div>
    );
  }

  const shortfall = Math.max(round.expected_amount - round.collected_amount, 0);
  const owingPositions = round.positions.filter(
    (position) => position.paid < position.expected,
  );
  const canClose = shortfall === 0 || acknowledgeShortfall;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-emerald-800 px-5 py-4 text-white">
        <Link
          href={`/groups/${groupId}`}
          className="mb-2 flex items-center gap-2 text-sm text-emerald-100"
        >
          <ChevronLeft size={18} />
          Round {round.number}
        </Link>
        <h1 className="text-lg font-bold">Close round {round.number}</h1>
        <p className="text-sm text-emerald-100">
          Collector: {round.collector.member_name}
        </p>
      </header>

      <section className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {shortfall > 0 && (
          <div className="rounded-md border-l-4 border-red-600 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {owingPositions.length} {owingPositions.length === 1 ? "position has" : "positions have"} not fully paid.
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Closing now records a shortfall of {shortfall.toLocaleString()} FCFA.
            </p>
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Still owing</h2>
          {owingPositions.length === 0 ? (
            <p className="text-sm text-emerald-700">Every position is fully paid.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {owingPositions.map((position) => (
                <div
                  key={position.position_id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {position.member_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Position {position.position_id}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-slate-900">
                    {(position.expected - position.paid).toLocaleString()} FCFA
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {shortfall > 0 && (
          <label className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={acknowledgeShortfall}
              onChange={(event) => setAcknowledgeShortfall(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              I confirm the group agreed to close this round short. The payout
              will be {round.collected_amount.toLocaleString()} FCFA and the
              shortfall will be recorded.
            </span>
          </label>
        )}

        {closeMutation.isError && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {(closeMutation.error as Error).message}
          </p>
        )}

        <button
          type="button"
          disabled={!canClose || closeMutation.isPending || round.status !== "open"}
          onClick={() => closeMutation.mutate()}
          className="w-full rounded-md bg-amber-100 py-3 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {closeMutation.isPending
            ? "Closing round..."
            : shortfall > 0
              ? "Close short and record shortfall"
              : "Close round"}
        </button>
      </section>
    </main>
  );
}
