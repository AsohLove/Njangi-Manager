"use client";

import { useState } from "react";
import {
  useCreateFine,
  usePayFine,
} from "@/hooks/useCollection";
import type { Fine, FineRule, Member } from "@/types/entities";

interface FineSectionsProps {
  groupId: number;
  members: Member[];
  rules: FineRule[];
  openRoundId?: number;
  fines: Fine[];
  isLoading: boolean;
  actionError: string | null;
  onError: (message: string | null) => void;
}

export function FineSections({
  groupId,
  members,
  rules,
  openRoundId,
  fines,
  isLoading,
  actionError,
  onError,
}: FineSectionsProps) {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [note, setNote] = useState("");

  const createFineMutation = useCreateFine(groupId);
  const payFineMutation = usePayFine(groupId);
  const owedFines = fines.filter((fine) => fine.status === "owed");
  const paidFines = fines.filter((fine) => fine.status === "paid");

  const resetForm = () => {
    setMemberId("");
    setRuleId("");
    setAmount("");
    setNote("");
    setShowApplyForm(false);
  };

  const submitFine = (event: React.FormEvent) => {
    event.preventDefault();

    if (!memberId || !ruleId) {
      onError("Select a member and a fine rule.");
      return;
    }

    if (amount !== "" && (Number.isNaN(Number(amount)) || Number(amount) <= 0)) {
      onError("Amount must be greater than zero.");
      return;
    }

    createFineMutation.mutate(
      {
        member_id: Number(memberId),
        rule_id: Number(ruleId),
        ...(amount !== "" ? { amount: Number(amount) } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(openRoundId ? { round_id: openRoundId } : {}),
      },
      {
        onSuccess: () => {
          resetForm();
          onError(null);
        },
        onError: (error: Error) => onError(error.message),
      },
    );
  };

  const markPaid = (fineId: number) => {
    payFineMutation.mutate(fineId, {
      onError: (error: Error) => onError(error.message),
    });
  };

  return (
    <>
      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <FineList
        title={`Owed · ${owedFines.reduce((total, fine) => total + fine.amount, 0).toLocaleString()} FCFA`}
        fines={owedFines}
        isLoading={isLoading}
        onPay={markPaid}
        payPending={payFineMutation.isPending}
        emptyMessage="No owed fines."
      />

      <FineList
        title={`Paid this cycle · ${paidFines.reduce((total, fine) => total + fine.amount, 0).toLocaleString()} FCFA`}
        fines={paidFines}
        isLoading={isLoading}
        emptyMessage="No paid fines yet."
      />

      {showApplyForm && (
        <form
          onSubmit={submitFine}
          className="rounded-lg border border-slate-300 bg-white p-4"
        >
          <h2 className="mb-3 font-semibold text-slate-900">Apply a fine</h2>
          <div className="space-y-3">
            <select
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
              required
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </select>

            <select
              value={ruleId}
              onChange={(event) => {
                const nextRuleId = event.target.value;
                setRuleId(nextRuleId);
                const rule = rules.find((item) => item.id === Number(nextRuleId));
                setAmount(rule?.defaultAmount ?? rule?.default_amount ?? "");
              }}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
              required
            >
              <option value="">Select fine rule</option>
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
            />
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note (optional)"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createFineMutation.isPending}
                className="flex-1 rounded-md bg-emerald-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {createFineMutation.isPending ? "Applying..." : "Apply fine"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {!showApplyForm && (
        <button
          type="button"
          onClick={() => setShowApplyForm(true)}
          className="w-full rounded-lg bg-emerald-900/10 py-3 text-sm font-semibold text-emerald-900"
        >
          + Apply a fine
        </button>
      )}

      <p className="px-1 text-xs text-slate-500">
        The add suggests a fine when a payment is late. A person always decides.
        Paid fines go to the group fund, never into the pot.
      </p>
    </>
  );
}

interface FineListProps {
  title: string;
  fines: Fine[];
  isLoading: boolean;
  emptyMessage: string;
  onPay?: (fineId: number) => void;
  payPending?: boolean;
}

function FineList({
  title,
  fines,
  isLoading,
  emptyMessage,
  onPay,
  payPending = false,
}: FineListProps) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading fines...</p>
      ) : fines.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-slate-200">
          {fines.map((fine) => (
            <div
              key={fine.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{fine.member_name}</p>
                <p className="text-xs text-slate-500">
                  {fine.rule_name}
                  {fine.round_id ? ` · Round ${fine.round_id}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {fine.amount.toLocaleString()}
                </span>
                {onPay ? (
                  <button
                    type="button"
                    disabled={payPending}
                    onClick={() => onPay(fine.id)}
                    className="rounded-md bg-emerald-900/10 px-3 py-2 text-xs font-semibold text-emerald-900 disabled:opacity-50"
                  >
                    Mark paid
                  </button>
                ) : (
                  <span className="rounded-full bg-emerald-900/10 px-2 py-1 text-[11px] font-bold text-emerald-800">
                    PAID
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
