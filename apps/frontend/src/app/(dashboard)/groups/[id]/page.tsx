"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGroup } from "@/hooks/useCollection";
import { PositionCard } from "@/components/ui/RoundCard";
import { Position, RoundPayment } from "@/types/entities";
import { Card } from "@/components/ui/Card";

export default function GroupPage() {
  const params = useParams();
  const groupId = Number(params.id);
  const { data: group, isLoading, isError } = useGroup(groupId);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-100 p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500 font-medium">
          Loading group details...
        </p>
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="w-full min-h-screen bg-slate-100 p-4 flex items-center justify-center">
        <p className="text-sm text-red-500 font-medium">
          Failed to load group details.
        </p>
      </div>
    );
  }

  const openRound = group.openRound;
  const paymentByPosition = new Map<number, RoundPayment>(
    (openRound?.payments ?? []).map((payment: RoundPayment) => [
      payment.positionId,
      payment,
    ]),
  );

  const formattedDueDate = openRound?.dueDate
    ? new Date(openRound.dueDate).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "—";

  const targetAmount = openRound?.targetAmount ?? 0;
  const collectedAmount = openRound?.collectedAmount ?? 0;
  const progressPercent =
    targetAmount > 0
      ? Math.min((collectedAmount / targetAmount) * 100, 100)
      : 0;

  const lastClosedRound =
    (group.activeCycle?.rounds ?? [])
      .filter(
        (round: { number: number; status: "open" | "closed" }) =>
          round.status === "closed",
      )
      .reduce(
        (
          latest: number,
          round: { number: number; status: "open" | "closed" },
        ) => Math.max(latest, round.number),
        0,
      ) || 1;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/members/${group.shareCode}`;

    const shareTitle = `${group.name} · Njangi Group Details`;

    const shareText =
      `🤝 Join / View ${group.name} on Njangi Manager\n` +
      `💰 Contribution: ${group.amount.toLocaleString()} XAF (${group.frequency})\n` +
      `👥 Members: ${group.totalMembers} | Round ${openRound?.number ?? 1}\n` +
      `🎯 Current Collector: ${group.openRound?.collectorName ?? "N/A"}\n\n` +
      `Click the link to view complete group details, position lists, and rules:`;
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
    } else {
      const fullMessage = `${shareText}\n${shareUrl}`;
      navigator.clipboard.writeText(fullMessage);
      alert("Group invitation & summary link copied to clipboard!");
    }
  };

  return (
    <div className="w-full max-w-full mx-auto min-h-screen bg-slate-100 pb-8 space-y-3 font-sans">
      <Card>
        <div className="flex justify-between items-center gap-2">
          <div className="flex flex-col gap-1 leading-tight">
            {openRound ? (
              <>
                <Link
                  href="/groups"
                  className="flex items-center text-lg font-bold hover:opacity-80 transition-opacity"
                >
                  <ChevronLeft size={24} />
                  Round {openRound.number} of {group.totalPositions}
                </Link>

                <p className="text-sm ml-4 text-slate-300">
                  {group.name} · Due {formattedDueDate}
                </p>
              </>
            ) : (
              <>
                <Link
                  href="/groups"
                  className="flex items-center text-lg font-bold hover:opacity-80 transition-opacity"
                >
                  <ChevronLeft size={24} />
                  Round closed
                </Link>

                <p className="text-sm ml-4 text-slate-300">
                  {group.name} · No open round
                </p>
              </>
            )}
          </div>

          <button
            onClick={handleShare}

            className="flex cursor-pointer items-center py-1 px-3 text-sm text-slate-100 rounded-2xl bg-slate-900/40"
          >
            Share Page
          </button>
        </div>
      </Card>

      <div className="px-3 space-y-3">
        {openRound ? (
          <>
            <div className="bg-white rounded-2xl p-4 border border-slate-300/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-normal">
                    Collector this round
                  </p>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <h2 className="text-lg font-bold text-slate-900">
                      {openRound.collectorName ?? "Unassigned"}
                    </h2>

                    {openRound.collectorRotationOrder && (
                      <span className="text-xs text-slate-400 font-medium">
                        · position {openRound.collectorRotationOrder}
                      </span>
                    )}
                  </div>
                </div>

                <span className="bg-emerald-900 text-slate-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  COLLECTS {targetAmount.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#0e4d36] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 font-normal">
                Collected{" "}
                <span className="font-bold text-slate-900">
                  {collectedAmount.toLocaleString()} FCFA
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900">
                  {targetAmount.toLocaleString()} FCFA
                </span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-300/80">
              <h3 className="text-sm font-bold text-slate-900 m-1.5">
                Positions
              </h3>

              <div className="divide-y divide-slate-300/80">
                {group.positions.map((pos: Position) => (
                  <PositionCard
                    key={pos.id}
                    groupId={group.id}
                    roundId={openRound.id}
                    roundNumber={openRound.number}
                    defaultAmount={group.amount}
                    position={pos}
                    paymentId={paymentByPosition.get(pos.id)?.id}
                    currentAmount={paymentByPosition.get(pos.id)?.amount}
                  />
                ))}
              </div>
            </div>

            <Link
              href={`/groups/${groupId}/rounds/${openRound.id}/close`}
              className="mt-3 block w-full rounded-md border border-amber-300 bg-amber-50 py-3 text-center text-sm font-semibold text-amber-700"
            >
              Close round {openRound.number} short
            </Link>

            <p className="p-3 text-slate-400 text-[13px]">
              Every position pays every round, including the collector&apos;s. A
              position cannot pay twice: the app refuses it.
            </p>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-slate-300/80 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              Round {lastClosedRound} closed
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              There is currently no open round for this group. Open the next
              round when you&apos;re ready.
            </p>

            <Link
              href={`/groups/${groupId}/members`}
              className="mt-5 block w-full rounded-md bg-slate-900 py-3 text-center text-sm font-semibold text-white"
            >
              Go to Members
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
