"use client";

import { useQuery } from "@tanstack/react-query";
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
  const { data: group } = useGroup(groupId);

  const apiFilter = filter === "funds" || filter === "all" ? "all" : filter;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ledger", groupId, apiFilter],
    queryFn: () => getLedger(groupId, apiFilter),
    enabled: Number.isInteger(groupId),
  });

  const entries = useMemo(() => {
    const allEntries = (data?.entries ?? []) as LedgerEntry[];
    if (filter === "funds") {
      return allEntries.filter(
        (entry) => entry.type === "spending" || entry.type === "adjustment",
      );
    }
    return allEntries;
  }, [data?.entries, filter]);

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

        {data?.next && (
          <p className="text-center text-xs text-slate-400">
            Older entries available
          </p>
        )}

        <p className="px-1 text-xs leading-4 text-slate-500">
          Every balance in the app is computed from these entries. Corrections
          are new entries with notes. Nothing is edited silently.
        </p>
      </main>
    </div>
  );
}