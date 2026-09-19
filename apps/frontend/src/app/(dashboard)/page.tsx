"use client";

import { useRouter } from "next/navigation";
import { SkeletonLoader } from "@/components/ui/Loader";
import { useQueryClient } from "@tanstack/react-query";
import { useGroups, useGroup } from "@/hooks/useCollection";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function Dashboard() {
  const router = useRouter();
  const { data: groups, isLoading, isError } = useGroups();
  const queryClient = useQueryClient();
  const treasurer = queryClient.getQueryData<{
    id: number;
    email: string;
    fullName: string;
  }>(["auth-user"]);
  return (
    <>
    <Card>
        <h1 className="text-xl font-bold leading-tight">My Groups</h1>
        <p className="text-xs text-emerald-100/90 mt-0.5 font-normal">
          Treasurer: {treasurer?.fullName}
        </p>
    </Card>
      {isLoading && (
        <section className="w-full m-2 bg-sky-50 py-12">
          <div className="max-w-(--breakpoint-2xl) grid grid-cols-1 lg:grid-cols-2 mx-auto px-4 sm:px-6 space-y-3 space-x-3">
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
        <section className="w-full bg-sky-50 py-12 text-center text-red-500 text-sm font-medium">
          Failed to fetch groups
        </section>
      )}

      
    </>
  );
}
