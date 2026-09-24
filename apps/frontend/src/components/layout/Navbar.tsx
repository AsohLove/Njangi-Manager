"use client";

import { RefreshCw, UserGroup, AlertTriangle, Coins, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

const navItems = [
  { label: "Round", suffix: "", icon: RefreshCw },
  { label: "Members", suffix: "/members", icon: UserGroup },
  { label: "Fines", suffix: "/fines", icon: AlertTriangle },
  { label: "Fund", suffix: "/fund", icon: Coins },
  { label: "Ledger", suffix: "/ledger", icon: BookOpen },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const params = useParams();
  
  const groupId = params?.groupId || params?.id; 

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white z-50 border-t border-slate-300/90">
      <div className="flex justify-between items-center px-4 py-2">
        {navItems.map((item) => {

          const targetHref = groupId ? `/groups/${groupId}${item.suffix}` : `#`;
          
          const isActive = item.suffix === "" 
            ? pathname === targetHref 
            : pathname.startsWith(targetHref);

          return (
            <Link
              key={item.label}
              href={targetHref}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 font-medium"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
