"use client";

import Link from "next/link";

export interface Group {
  id: number;
  ownerId: number;
  name: string;
  amount: number;
  frequency: string;
  startDate: string;
  orderMode: string;
  shareCode: string;
  createdAt: string;
  currentRoundNumber: number;
  collectorName: string;
  collectorPositionId: number;
  paidCount: number;
  totalMembers: number;
}

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const formattedAmount = `${new Intl.NumberFormat("fr-FR").format(
    group.amount,
  )} FCFA`;

  const formattedFrequency =
    group.frequency.charAt(0).toUpperCase() + group.frequency.slice(1);

  const formattedOrderMode =
    group.orderMode === "fixed"
      ? "Fixed order"
      : group.orderMode === "ballot"
        ? "Ballot draw"
        : group.orderMode;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="block w-full bg-white rounded-lg border border-gray-300/80 p-3.5 hover:border-emerald-700/70 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-gray-900 truncate">
          {group.name}
        </h3>
        <span className="shrink-0 text-[10px] font-semibold tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
          Round {group.currentRoundNumber ?? "To"} Open
        </span>
      </div>

      <div className="text-xs text-gray-600 mb-3">
        <span className="font-bold text-gray-900">{formattedAmount}</span>
        {" · "}
        <span>{formattedFrequency}</span>
        {" · "}
        <span>{formattedOrderMode}</span>

        {" · "}
        <span>{group.totalMembers} positions</span>
      </div>
      <div className="rounded-lg bg-gray-200  text-xs text-gray-600">
        <div
          className={`rounded-lg py-1.5 bg-emerald-800`}
          style={{
            width: `${((group.paidCount ?? 0) / (group.totalMembers === 0 ? 1 : group.totalMembers)) * 100}%`,
          }}
        ></div>
      </div>
      <div className="mt-2 text-gray-600 flex  text-center flex-wrap">
        <span className="text-xs text-gray-600">
          Collected:{" "}
          <span className="font-bold">
            {group.paidCount * group.amount} FCFA {" "}
          </span>
          of{" "}
          <span className="font-bold">
            {group.totalMembers * group.amount} FCFA
          </span>
        </span>
        {" · "}
        <span className="text-xs text-gray-600">
          Collector:{" "}
          <span className="font-bold">
            {group.collectorName ?? '—'}
          </span>
        </span>
      </div>
    </Link>
  );
}
