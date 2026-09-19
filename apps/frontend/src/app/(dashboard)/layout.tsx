"use client";

import { type ReactNode } from "react";

import { AuthGuard } from "@/components/layout/AuthGuard";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
          <main >{children}</main>
      </div>
    </AuthGuard>
  );
}
