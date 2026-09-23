"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGroup } from "@/hooks/useCollection";
import { PositionCard } from "@/components/ui/RoundCard";
import { Position } from "@/types/entities";
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

  // Format Due Date (e.g. "Sat 30 Nov")
  const formattedDueDate = openRound?.dueDate
    ? new Date(openRound.dueDate).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "—";

  // Financial calculations for collector card
  const targetAmount =
    openRound?.targetAmount ?? group.totalPositions * group.amount;
  const collectedAmount = openRound?.collectedAmount ?? 0;
  const progressPercent =
    targetAmount > 0
      ? Math.min((collectedAmount / targetAmount) * 100, 100)
      : 0;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/members/${group.shareCode}`;
    if (navigator.share) {
      navigator.share({
        title: group.name,
        text: `Check out the details for ${group.name}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Group page link copied to clipboard");
    }
  };

  return (
    <div className="w-full max-w-full mx-auto min-h-screen bg-slate-100 pb-8 space-y-3 font-sans">
      <Card>
        <div className="flex justify-between items-center gap-2">
          <div className="flex flex-col gap-1leading-tight">
            <Link
              href="/"

              className=" flex items-center text-lg font-bold hover:opacity-80 transition-opacity"
            >
              <ChevronLeft size={24} />
              Round {openRound?.number ?? 1} of {group.totalPositions}
            </Link>

            <p className="text-sm ml-4 text-slate-300 ">
              {group.name} · Due {formattedDueDate}
            </p>
          </div>

          <button
            onClick={handleShare}

            className="flex cursor-pointer item-center py-1 px-3 text-sm text-slate-100 rounded-2xl bg-slate-900/40"
          >
            Share Page
          </button>
        </div>
      </Card>

      <div className="px-3 space-y-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-300/80 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-normal">
                Collector this round
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <h2 className="text-lg font-bold text-slate-900">
                  {openRound?.collectorName ?? "Unassigned"}
                </h2>
                {openRound?.collectorRotationOrder && (
                  <span className="text-xs text-slate-400 font-medium">
                    · position {openRound.collectorRotationOrder}
                  </span>
                )}
              </div>
            </div>

            {/* COLLECTS Badge */}
            <span className="bg-emerald-900 text-slate-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              COLLECTS {targetAmount.toLocaleString()}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#0e4d36] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Collected vs Target Footer */}
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
          <h3 className="text-sm font-bold text-slate-900 m-1.5">Positions</h3>

          <div className="divide-y divide-slate-300/80">
            {group.positions.map((pos: Position) => (
              <PositionCard
                key={pos.id}
                groupId={group.id}
                roundId={openRound?.id ?? 0}
                roundNumber={openRound?.number ?? 1}
                defaultAmount={group.amount}
                position={pos}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
