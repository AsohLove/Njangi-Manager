"use client";

import { useShare } from "@/hooks/useCollection";
import { useParams } from "next/navigation";
import {
  ShareGroupResponse,
  SharePosition,
  ShareFine,
} from "@/types/entities";

export default function MemberView() {
  const params = useParams();
  const code = String(params.code ?? "").trim();

  const { data, isLoading, isError } = useShare(code);
  const sharedata = data as ShareGroupResponse | undefined;

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-100 p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500 font-medium">Loading summary...</p>
      </div>
    );
  }

  if (isError || !sharedata) {
    return (
      <div className="w-full min-h-screen bg-slate-100 p-4 flex items-center justify-center">
        <p className="text-sm text-red-500 font-medium">
          Failed to load public summary page.
        </p>
      </div>
    );
  }

  const currentRound = sharedata.current_round;
  const collector = currentRound?.collector;

  const targetAmount = collector?.target_amount ?? 0;
  const collectedAmount = collector?.collected_amount ?? 0;
  const progressPercent =
    targetAmount > 0
      ? Math.min((collectedAmount / targetAmount) * 100, 100)
      : 0;

  const formattedDueDate = currentRound?.due_date
    ? new Date(currentRound.due_date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 pb-10 space-y-3 font-sans">
      <header className="bg-slate-950 text-white p-4 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">{sharedata.name}</h1>
        <p className="text-xs text-slate-200/70 mt-0.5">
          Public summary · read only · no login
        </p>
      </header>

      <div className="px-3 space-y-3">
        {currentRound && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-slate-900">
                Round {currentRound.number} of {sharedata.total_rounds} · collecting
              </span>

              {collector && (
                <span className="bg-emerald-950 text-slate-200 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {collector.member_name} COLLECTS
                </span>
              )}
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-900 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Collected{" "}
              <span className="font-bold text-slate-900">
                {collectedAmount.toLocaleString()} FCFA
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {targetAmount.toLocaleString()} FCFA
              </span>
              {formattedDueDate && ` · due ${formattedDueDate}`}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Positions</h3>

          <div className="divide-y divide-slate-100">
            {currentRound?.positions.map((pos: SharePosition) => (
              <div
                key={pos.position_id}
                className="flex items-center justify-between py-3 px-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold text-sm">
                    {pos.rotation_order}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-sm">
                      {pos.member_name}
                    </span>
                    {pos.position_label && (
                      <span className="text-xs text-slate-400 font-medium">
                        {pos.position_label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {pos.round_status === "paid" && (
                    <span className="bg-emerald-100/70 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      PAID
                    </span>
                  )}

                  {pos.round_status === "partly" && (
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      PARTLY {pos.paid_amount.toLocaleString()}
                    </span>
                  )}

                  {pos.round_status === "waiting" && (
                    <span className="bg-slate-100 text-slate-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      WAITING
                    </span>
                  )}

                  {pos.is_late && (
                    <span className="bg-amber-800 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      LATE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {sharedata.fines && sharedata.fines.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Fines · owed</h3>

            <div className="divide-y divide-slate-100">
              {sharedata.fines.map((fine: ShareFine) => (
                <div
                  key={fine.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {fine.member_name}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {fine.rule_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {fine.amount.toLocaleString()}
                    </span>
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      OWED
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              This list is visible to anyone with the link.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Group fund</h3>
            <p className="text-xs text-slate-400 font-medium">
              {sharedata.fund_source_note || "From paid fines"}
            </p>
          </div>
          <span className="text-base font-extrabold text-slate-900">
            {sharedata.fund_balance.toLocaleString()}
          </span>
        </div>

        <p className="text-center text-xs text-slate-400 font-medium px-4 pt-2">
          No phone numbers are shown here. Ask the treasurer for changes. The
          treasurer can replace this link at any time.
        </p>
      </div>
    </div>
  );
}