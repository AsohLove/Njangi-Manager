"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  createFundSpending,
  getGroupFund,
  getGroupbyId,
} from "@/lib/api-client";

type FundHistoryItem = {
  type: "fine" | "adjustment" | "spending";
  id: number;
  amount: number;
  memberName: string | null;
  roundNumber: number | null;
  note: string | null;
  createdAt: string | null;
};

type GroupFund = {
  balance: number;
  paid_fines: number;
  adjustments: number;
  spending: number;
  history: FundHistoryItem[];
};

export default function GroupFundPage() {
  const params = useParams();
  const groupId = Number(params.id);

  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupbyId(groupId),
    enabled: Number.isInteger(groupId),
  });

  const {
    data: fund,
    isLoading: fundLoading,
    isError: fundError,
  } = useQuery<GroupFund>({
    queryKey: ["group-fund", groupId],
    queryFn: () => getGroupFund(groupId),
    enabled: Number.isInteger(groupId),
  });

  const spendingMutation = useMutation({
    mutationFn: () =>
      createFundSpending(groupId, {
        amount: Number(amount),
        note: note.trim(),
      }),

    onMutate: () => {
      setActionError(null);
    },

    onSuccess: () => {
      setAmount("");
      setNote("");

      queryClient.invalidateQueries({
        queryKey: ["group-fund", groupId],
      });

      queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });
    },

    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  if (groupLoading || fundLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading group fund...</p>
      </div>
    );
  }

  if (!group || fundError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Unable to load group fund.</p>
      </div>
    );
  }

  const balance = fund?.balance ?? 0;
  const paidFines = fund?.paid_fines ?? 0;
  const adjustments = fund?.adjustments ?? 0;
  const spendingTotal = fund?.spending ?? 0;
  const history = fund?.history ?? [];

  const canSubmit =
    Number(amount) > 0 &&
    note.trim().length > 0 &&
    Number(amount) <= balance &&
    !spendingMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-800 px-5 py-4 text-white">
        <div className="flex items-center gap-4">
          <Link href={`/groups/${groupId}`} className="text-2xl">
            ‹
          </Link>

          <div>
            <h1 className="text-lg font-bold">Group fund</h1>

            <p className="text-sm text-emerald-100">{group.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-24">
        {/* Fund summary */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 text-center">
          <p className="text-sm text-slate-500">Fund balance</p>

          <p className="mt-1 text-3xl font-bold tracking-wide text-slate-900">
            {balance.toLocaleString()}{" "}
            <span className="text-sm font-semibold">FCFA</span>
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Fines in{" "}
            <span className="font-medium text-slate-700">
              {paidFines.toLocaleString()} FCFA
            </span>{" "}
            · Spending{" "}
            <span className="font-medium text-slate-700">
              {spendingTotal.toLocaleString()} FCFA
            </span>
          </p>
        </section>

        {/* History placeholder */}
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">History</h2>

          <div className="mt-3">
            {history.length === 0 ? (
              <div className="rounded-md bg-slate-50 px-4 py-5 text-center">
                <p className="text-sm text-slate-600">No fund activity yet.</p>
              </div>
            ) : (
              history.map((item) => {
                const isSpending = item.type === "spending";

                const title =
                  item.type === "fine"
                    ? `Fine paid · ${item.memberName}`
                    : item.type === "spending"
                      ? "Spending"
                      : "Adjustment";

                const subtitle =
                  item.type === "fine"
                    ? item.roundNumber
                      ? `Round ${item.roundNumber}`
                      : "Fine payment"
                    : item.note;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="border-b border-slate-200 py-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{title}</p>

                        {subtitle && (
                          <p className="text-xs text-slate-500">{subtitle}</p>
                        )}
                      </div>

                      <p
                        className={`shrink-0 font-semibold ${
                          isSpending ? "text-red-600" : "text-emerald-800"
                        }`}
                      >
                        {isSpending ? "-" : "+"} {item.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Error */}
        {actionError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {/* Record spending */}
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Record spending</h2>

          <div className="mt-3">
            <label
              htmlFor="amount"
              className="block text-xs font-medium text-slate-600"
            >
              Amount (FCFA)
            </label>

            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-700"
            />
          </div>

          <div className="mt-3">
            <label
              htmlFor="note"
              className="block text-xs font-medium text-slate-600"
            >
              Note
            </label>

            <input
              id="note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What was it for?"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-700"
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => spendingMutation.mutate()}
            className="mt-3 w-full rounded-md bg-emerald-100 py-3 text-sm font-semibold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {spendingMutation.isPending ? "Recording..." : "Record spending"}
          </button>

          <p className="mt-3 text-xs text-slate-500">
            Spending more than the available balance is refused.
          </p>
        </section>
      </main>
    </div>
  );
}
