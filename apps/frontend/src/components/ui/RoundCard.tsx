"use client";

import { Position } from "@/types/entities";
import { RecordPaymentDrawer } from "../forms/RecordPayment";

interface PositionCardProps {
  groupId: number;
  roundId: number;
  roundNumber: number;
  defaultAmount: number;
  position: Position;
}

export function PositionCard({
  groupId,
  roundId,
  roundNumber,
  defaultAmount,
  position,
}: PositionCardProps) {
  const remainingAmount = defaultAmount - (position.amountPaid || 0);

  return (
    <div className="flex items-center justify-between py-3 px-2 border-b border-slate-300/80 last:border-none">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-800/15 text-emerald-900 flex items-center justify-center font-semibold text-sm">
          {position.rotationOrder}
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm">
            {position.memberName}
          </span>
          {position.positionLabel && (
            <span className="text-xs text-slate-400 font-normal">
              {position.positionLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {position.paymentStatus === "PAID" && (
          <span className="bg-emerald-100/70 text-emerald-950 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            PAID
          </span>
        )}

        {position.paymentStatus === "PARTLY" && (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            PARTLY {position.amountPaid?.toLocaleString()}
          </span>
        )}

        {position.paymentStatus === "WAITING" && (
          <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            WAITING
          </span>
        )}

        {/* LATE Badge */}
        {position.isLate && (
          <span className="bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            LATE
          </span>
        )}

        {/* Record Payment Trigger (Show for WAITING or PARTLY) */}
        {position.paymentStatus !== "PAID" && (
          <RecordPaymentDrawer
            groupId={groupId}
            roundId={roundId}
            roundNumber={roundNumber}
            positionId={position.id}
            positionNumber={position.rotationOrder as number}
            memberName={position.memberName}
            defaultAmount={
              remainingAmount > 0 ? remainingAmount : defaultAmount
            }
          />
        )}
      </div>
    </div>
  );
}
