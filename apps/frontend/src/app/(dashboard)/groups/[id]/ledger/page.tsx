"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useGroup } from "@/hooks/useCollection";
import { getLedger } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { LedgerEntry, FilterKey } from "@/types/entities";
import { formatEntryAmount, formatEntry } from "@/lib/utils";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "payment", label: "Payments" },
  { key: "payout", label: "Payouts" },
  { key: "fine", label: "Fines" },
  { key: "funds", label: "Fund" },
];

export default function LedgerPage() {
  const params = useParams();
  const groupId = Number(params.id);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [roundFilter, setRoundFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const { data: group } = useGroup(groupId);

  const apiFilter = filter === "funds" || filter === "all" ? "all" : filter;
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["ledger", groupId, apiFilter],
    queryFn: ({ pageParam }) => getLedger(groupId, apiFilter, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: Number.isInteger(groupId),
  });

  const allEntries = useMemo(
    () => (data?.pages.flatMap((page) => page.entries) ?? []) as LedgerEntry[],
    [data?.pages],
  );

  const rounds = useMemo(() => {
    return Array.from(
      new Map(
        allEntries
          .filter((entry) => entry.round_number != null)
          .map((entry) => [entry.round_id, entry.round_number]),
      ).entries(),
    ).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  }, [allEntries]);

  const members = useMemo(() => {
    return Array.from(
      new Map(
        allEntries
          .filter((entry) => entry.member_id != null)
          .map((entry) => [entry.member_id, entry.member_name]),
      ).entries(),
    ).sort((a, b) => (a[1] ?? "").localeCompare(b[1] ?? ""));
  }, [allEntries]);

  const entries = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesType =
        filter === "funds"
          ? entry.type === "spending" || entry.type === "adjustment"
          : filter === "all"
            ? true
            : entry.type === filter;

      const matchesRound =
        roundFilter === "all" || String(entry.round_id) === roundFilter;

      const matchesMember =
        memberFilter === "all" || String(entry.member_id) === memberFilter;

      return matchesType && matchesRound && matchesMember;
    });
  }, [allEntries, filter, roundFilter, memberFilter]);

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <Card>
        <div className="flex items-center gap-2">
          <Link
            href={`/groups/${groupId}`}
            className="-ml-1 rounded-full p-1 transition-colors hover:bg-emerald-900/60"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">Ledger</h1>
            <p className="text-xs text-slate-300/80">
              {group?.name ?? "Loading..."} · newest first
            </p>
          </div>
        </div>
      </Card>

      <main className="w-full space-y-3 p-3">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === item.key
                  ? "border-emerald-800 bg-emerald-800 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={roundFilter}
            onChange={(event) => setRoundFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">All rounds</option>

            {rounds.map(([roundId, roundNumber]) => (
              <option key={roundId} value={String(roundId)}>
                Round {roundNumber}
              </option>
            ))}
          </select>

          <select
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">All members</option>

            {members.map(([memberId, memberName]) => (
              <option key={memberId} value={String(memberId)}>
                {memberName}
              </option>
            ))}
          </select>
        </div>

        <section className="overflow-hidden rounded-md border border-slate-300 bg-white">
          {isLoading ? (
            <p className="p-3 text-sm text-slate-500">Loading ledger...</p>
          ) : isError ? (
            <p className="p-3 text-sm text-red-600">
              Unable to load ledger entries.
            </p>
          ) : entries.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">No ledger entries yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {entries.map((entry) => (
                <div
                  key={`${entry.type}-${entry.id}`}
                  className="ml-6 flex min-h-[29px] items-center justify-between gap-3 border-l border-l-rose-200 border-slate-200 px-3 py-1"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] leading-4 text-slate-700">
                      {formatEntry(entry)}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-[13px] font-bold leading-4 text-slate-900">
                    {formatEntryAmount(entry)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading older entries..." : "Load older entries"}
          </button>
        )}

        <p className="px-1 text-xs leading-4 text-slate-500">
          Every balance in the app is computed from these entries. Corrections
          are new entries with notes. Nothing is edited silently.
        </p>
      </main>
    </div>
  );
}
