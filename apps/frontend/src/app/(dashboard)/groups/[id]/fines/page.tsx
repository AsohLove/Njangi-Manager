"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useFineRules, useFines, useGroup } from "@/hooks/useCollection";
import { CreateRuleDrawer } from "@/components/forms/addRule";
import { FineSections } from "@/components/fines/FineSections";
import { Card } from "@/components/ui/Card";
import type { FineRule } from "@/types/entities";

export default function FinePage() {
  const params = useParams();
  const id = Number(params.id);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: fineRules, isLoading: isRulesLoading } = useFineRules(id);
  const { data: group } = useGroup(id);
  const { data: finesData, isLoading: isFinesLoading } = useFines(id);
  const rules: FineRule[] = Array.isArray(fineRules) ? fineRules : [];

  return (
    <div className="min-h-screen w-full bg-slate-100 pb-10 font-sans">
      <Card>
        <div className="flex items-center gap-2">
          <Link
            href={`/groups/${id}`}
            className="-ml-1 rounded-full p-1 transition-colors hover:bg-emerald-900/60"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">Fines</h1>
            <p className="text-xs text-slate-300/80">
              {group?.name || "Family Njangi"}
            </p>
          </div>
        </div>
      </Card>

      <main className="w-full space-y-3 p-3">
        <section className="space-y-3 rounded-2xl border border-slate-300/90 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Group fine rules</h2>
          <div className="flex flex-wrap items-center gap-2">
            {isRulesLoading ? (
              <span className="text-xs text-slate-400">Loading rules...</span>
            ) : (
              rules.map((rule) => {
                const amount = rule.defaultAmount ?? rule.default_amount ?? 0;
                return (
                  <div
                    key={rule.id}
                    className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
                  >
                    <span>{rule.name}</span>
                    <span className="mx-1 font-normal text-slate-400">·</span>
                    <span>{amount.toLocaleString()}</span>
                  </div>
                );
              })
            )}
            <CreateRuleDrawer groupId={id} amount={group?.amount ?? 0} />
          </div>
        </section>

        <FineSections
          groupId={id}
          members={group?.members ?? []}
          rules={rules}
          openRoundId={group?.openRound?.id}
          fines={finesData?.items ?? []}
          isLoading={isFinesLoading}
          actionError={actionError}
          onError={setActionError}
        />
      </main>
    </div>
  );
}
