"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useFineRules, useGroup } from "@/hooks/useCollection";
import { CreateRuleDrawer } from "@/components/forms/addRule";
import { Card } from "@/components/ui/Card";

interface FineRule {
  id: number;
  name: string;
  defaultAmount?: number;
  default_amount?: number;
}

export default function FinePage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: finerules, isLoading: isRulesLoading } = useFineRules(id);
  const { data: group } = useGroup(id);

  const rulesList: FineRule[] = Array.isArray(finerules) ? finerules : [];

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
                    className="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs"
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
      </div>
    </div>
  );
}