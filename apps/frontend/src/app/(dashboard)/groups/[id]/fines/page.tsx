"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useFineRules, useGroup } from "@/hooks/useCollection";
import { CreateRuleDrawer } from "@/components/forms/addRule";
import { Card } from "@/components/ui/Card";
import { apiClient } from "@/lib/api-client";
import type { Member } from "@/types/entities";

interface FineRule {
  id: number;
  name: string;
  defaultAmount?: number;
  default_amount?: number;
}

interface Fine {
  id: number;
  member_id: number;
  member_name: string;
  rule_id: number;
  rule_name: string;
  round_id: number | null;
  amount: number;
  note: string | null;
  status: "owed" | "paid";
  applied_at: string;
  paid_at: string | null;
}

export default function FinePage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: finerules, isLoading: isRulesLoading } = useFineRules(id);
  const { data: group } = useGroup(id);

  const { data: finesData, isLoading: isFinesLoading } = useQuery({
    queryKey: ["fines", id],
    queryFn: async () => {
      const response = await apiClient.get(`/groups/${id}/fines?limit=100`);
      return response.data as { items: Fine[]; next: number | null };
    },
    enabled: Number.isInteger(id),
  });

  const applyFineMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/groups/${id}/fines`, {
        member_id: Number(memberId),
        rule_id: Number(ruleId),
        ...(amount !== "" ? { amount: Number(amount) } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(group?.openRound?.id ? { round_id: group.openRound.id } : {}),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fines", id] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      setMemberId("");
      setRuleId("");
      setAmount("");
      setNote("");
      setShowApplyForm(false);
      setActionError(null);
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const payFineMutation = useMutation({
    mutationFn: (fineId: number) => apiClient.post(`/fines/${fineId}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fines", id] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const rulesList: FineRule[] = Array.isArray(finerules) ? finerules : [];
  const fines: Fine[] = finesData?.items ?? [];
  const owedFines = fines.filter((fine) => fine.status === "owed");
  const paidFines = fines.filter((fine) => fine.status === "paid");
  const selectedRule = rulesList.find((rule) => rule.id === Number(ruleId));

  const submitFine = (event: React.FormEvent) => {
    event.preventDefault();
    if (!memberId || !ruleId) {
      setActionError("Select a member and a fine rule.");
      return;
    }
    if (amount !== "" && (Number.isNaN(Number(amount)) || Number(amount) <= 0)) {
      setActionError("Amount must be greater than zero.");
      return;
    }
    applyFineMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans pb-10">
      <Card>
        <div className="flex items-center gap-2">
          <Link
            href={`/groups/${id}`}
            className="p-1 -ml-1 hover:bg-emerald-900/60 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">Fines</h1>
            <p className="text-xs text-slate-300/80">
              {group?.name || "Family Njangi"}
            </p>
          </div>
        </div>
      </Card>

      <div className="p-3 space-y-3 w-full mx-auto">
        <div className="bg-white rounded-2xl p-4 border border-slate-300/90 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Group fine rules</h2>

          <div className="flex flex-wrap items-center gap-2">
            {isRulesLoading ? (
              <span className="text-xs text-slate-400">Loading rules...</span>
            ) : (
              rulesList.map((rule) => {
                const amount = rule.defaultAmount ?? rule.default_amount ?? 0;
                return (
                  <div
                    key={rule.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-800 shadow-2xs"
                  >
                    <span>{rule.name}</span>
                    <span className="mx-1 text-slate-400 font-normal">·</span>
                    <span>{amount.toLocaleString()}</span>
                  </div>
                );
              })
            )}

            <CreateRuleDrawer groupId={id} amount={group?.amount} />
          </div>
        </div>

        {actionError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <section className="rounded-lg border border-slate-300 bg-white p-4 ">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Owed · {owedFines.reduce((total, fine) => total + fine.amount, 0).toLocaleString()} FCFA
            </h2>
          </div>

          {isFinesLoading ? (
            <p className="text-sm text-slate-500">Loading fines...</p>
          ) : owedFines.length === 0 ? (
            <p className="text-sm text-slate-500">No owed fines.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {owedFines.map((fine) => (
                <div key={fine.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{fine.member_name}</p>
                    <p className="text-xs text-slate-500">
                      {fine.rule_name}{fine.round_id ? ` · Round ${fine.round_id}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {fine.amount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      disabled={payFineMutation.isPending}
                      onClick={() => payFineMutation.mutate(fine.id)}
                      className="rounded-md bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900 disabled:opacity-50"
                    >
                      Mark paid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-300 bg-white p-4 ">
          <h2 className="mb-3 font-semibold text-slate-900">
            Paid this cycle · {paidFines.reduce((total, fine) => total + fine.amount, 0).toLocaleString()} FCFA
          </h2>
          {paidFines.length === 0 ? (
            <p className="text-sm text-slate-500">No paid fines yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {paidFines.map((fine) => (
                <div key={fine.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{fine.member_name}</p>
                    <p className="text-xs text-slate-500">
                      {fine.rule_name}{fine.round_id ? ` · Round ${fine.round_id}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{fine.amount.toLocaleString()}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800">PAID</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {showApplyForm && (
          <form onSubmit={submitFine} className="rounded-lg border border-slate-300 bg-white p-4 ">
            <h2 className="mb-3 font-semibold text-slate-900">Apply a fine</h2>
            <div className="space-y-3">
              <select
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
                required
              >
                <option value="">Select member</option>
                {(group?.members ?? []).map((member: Member) => (
                  <option key={member.id} value={member.id}>{member.fullName}</option>
                ))}
              </select>
              <select
                value={ruleId}
                onChange={(event) => {
                  const nextRuleId = event.target.value;
                  setRuleId(nextRuleId);
                  const rule = rulesList.find((item) => item.id === Number(nextRuleId));
                  setAmount(rule?.defaultAmount ?? rule?.default_amount ?? "");
                }}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
                required
              >
                <option value="">Select fine rule</option>
                {rulesList.map((rule) => (
                  <option key={rule.id} value={rule.id}>{rule.name}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={selectedRule ? String(selectedRule.defaultAmount ?? selectedRule.default_amount ?? "") : "Amount"}
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
                <button type="submit" disabled={applyFineMutation.isPending} className="flex-1 rounded-md bg-emerald-900 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {applyFineMutation.isPending ? "Applying..." : "Apply fine"}
                </button>
                <button type="button" onClick={() => setShowApplyForm(false)} className="rounded-md bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
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
            className="w-full rounded-lg bg-emerald-100 py-3 text-sm font-semibold text-emerald-900"
          >
            + Apply a fine
          </button>
        )}

        <p className="px-1 text-xs text-slate-500">
          The add suggests a fine when a payment is late. A person always decides. Paid fines go to the group fund, never into the pot.
        </p>
      </div>
    </div>
  );
}