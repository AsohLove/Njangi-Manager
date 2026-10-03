"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { getGroups } from "@/lib/api-client";
import { SkeletonLoader } from "../ui/Loader";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: groups,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["auth-check"],
    queryFn: getGroups,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!isLoading && (isError || groups === undefined)) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isError, groups, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-slate-50">
        <SkeletonLoader />
      </div>
    );
  }

  if (isError || groups === undefined) {
    return null;
  }

  return <>{children}</>;
}

export function Loader() {
    return (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    )
}