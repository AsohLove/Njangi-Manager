"use client";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
export default function GroupPage() {
  return (
    <div className="w-full">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <ArrowLeft size={20} />
              </Link>
              Roud {"1"} of {"4"}
            </h1>
            <p className="text-sm text-slate-900/90 mt-0.5 font-normal">
              {"family Njangi"}
            </p>
          </div>
          <div>Share Page</div>
        </div>
      </Card>
      <div className="bg-red-500">Group Page</div>
    </div>
  );
}
