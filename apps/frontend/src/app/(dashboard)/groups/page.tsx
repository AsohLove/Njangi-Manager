"use client";

import Link from "next/link"; 
import { Plus, LogOut } from "lucide-react";

import { useGroups } from "@/hooks/useCollection";
import { GroupCard } from "@/components/ui/GroupCard";
import { Card } from "@/components/ui/Card";
import { GroupProps } from "@/types/entities";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLogout } from "@/hooks/useCollection";

export default function Dashboard() {
  const { data: groups, isLoading, isError } = useGroups();
  const { mutate: logout, isPending } = useLogout();
  const treasurer = useCurrentUser();

  return (
    <div className="pb-20">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold leading-tight">My Groups</h1>
            <p className="text-xs text-emerald-100/90 mt-0.5 font-normal">
              Treasurer: {treasurer?.fullName ?? "—"}
            </p>
          </div>
          <div>
            <button
              onClick={() => logout()}
              disabled={isPending}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-950 rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isPending ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>
      </Card>

      {isLoading && (
        <section className="w-full bg-sky-50/50 py-6 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-7xl mx-auto">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 bg-white/70 rounded-xl border border-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        </section>
      )}

      {isError && (
        <section className="w-full bg-red-50 py-8 text-center text-red-600 text-sm font-medium">
          Failed to fetch groups. Please try refreshing.
        </section>
      )}

      {groups && (
        <section className="w-full bg-sky-50/50 py-6 px-4">
          <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-3 mx-auto">
            {groups.map((group: GroupProps) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <Link
          href="/groups/new"
          className="flex items-center justify-center gap-2 py-3 px-4 font-semibold text-sm bg-emerald-900 text-white rounded-lg hover:bg-emerald-950 transition-colors w-full shadow-sm"
        >
          <Plus size={18} />
          Create a group
        </Link>
      </div>
    </div>
  );
}
