import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LedgerEntry} from "@/types/entities";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(amount: number) {
  return `${amount >= 0 ? "+" : "-"} ${Math.abs(amount).toLocaleString()}`;
}

export function formatEntryAmount(entry: LedgerEntry) {
  if (entry.type === "fine" && entry.status === "owed") {
    return `${entry.amount.toLocaleString()} owed`;
  }

  return formatAmount(entry.amount);
}

export function formatEntry(entry: LedgerEntry) {
  if (entry.type === "payment") {
    const position = entry.position_order
      ? `position ${entry.position_order}`
      : "payment";
    return `Payment · ${entry.member_name} · ${position} · R${entry.round_number ?? entry.round_id ?? "—"}`;
  }

  if (entry.type === "payout") {
    return `Payout · ${entry.member_name} · round ${entry.round_number ?? entry.round_id ?? "—"}`;
  }

  if (entry.type === "fine") {
    return `${entry.status === "paid" ? "Fine paid" : "Fine applied"} · ${entry.member_name} · ${entry.rule_name ?? "Fine"}${entry.round_number ? ` · R${entry.round_number}` : ""}`;
  }

  return entry.label ?? (entry.type === "spending" ? "Spending" : "Adjustment");
}