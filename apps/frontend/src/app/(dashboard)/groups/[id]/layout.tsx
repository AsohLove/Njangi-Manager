"use client";

import { type ReactNode } from "react";

import { BottomNavbar } from "@/components/layout/Navbar";

type GroupLayoutProps = {
  children: ReactNode;
};


export default function GroupPageLayout({children}: GroupLayoutProps) {

  return (
    <div className="min-h-screen bg-slate-50">
      <main>{children}</main>
      <BottomNavbar />
    </div>
  );
}