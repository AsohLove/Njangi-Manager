"use client";

import { type FormEvent, useState } from "react";
import { groupDto } from "@/types/entities";

type GroupFormProps = {
  isSubmitting?: boolean;
  onSubmit: (payload: groupDto) => void;
};

export function GroupForm({ isSubmitting = false, onSubmit }: GroupFormProps) {
  const [payload, setPayload] = useState<groupDto>({
    name: "",
    amount: 0,
    frequency: "monthly",
    start_date: new Date().toISOString().split("T")[0],
    order_mode: "fixed",
  });

  const setField = <K extends keyof groupDto>(field: K, value: groupDto[K]) => {
    setPayload((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 text-sm font-sans"
    >
      {/* Group Name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block font-semibold text-gray-700">
          Group name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Family Njangi"
          value={payload.name}
          onChange={(e) => setField("name", e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 placeholder:text-gray-400"
        />
      </div>

      {/* Contribution Amount */}
      <div className="space-y-1.5">
        <label htmlFor="amount" className="block font-semibold text-gray-700">
          Contribution amount (FCFA)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="1"
          placeholder="5 000"
          value={payload.amount || ""}
          onChange={(e) => setField("amount", Number(e.target.value))}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 placeholder:text-gray-400"
        />
      </div>

      {/* Frequency Toggle */}
      <div className="space-y-1.5">
        <label className="block font-semibold text-gray-700">Frequency</label>
        <div className="grid grid-cols-2 rounded-lg border border-gray-300 p-0.5 bg-white">
          <button
            type="button"
            onClick={() => setField("frequency", "monthly")}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              payload.frequency === "monthly"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setField("frequency", "weekly")}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              payload.frequency === "weekly"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Start Date */}
      <div className="space-y-1.5">
        <label
          htmlFor="start_date"
          className="block font-semibold text-gray-700"
        >
          Start date
        </label>
        <input
          id="start_date"
          name="start_date"
          type="date"
          value={payload.start_date}
          onChange={(e) => setField("start_date", e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
        />
      </div>

      {/* Payout Order Toggle */}
      <div className="space-y-1.5">
        <label className="block font-semibold text-gray-700">
          Payout order
        </label>
        <div className="grid grid-cols-2 rounded-lg border border-gray-300 p-0.5 bg-white">
          <button
            type="button"
            onClick={() => setField("order_mode", "fixed")}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              payload.order_mode === "fixed"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Fixed order
          </button>
          <button
            type="button"
            onClick={() => setField("order_mode", "ballot")}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              payload.order_mode === "ballot"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Ballot draw
          </button>
        </div>
        <p className="text-[11px] leading-snug text-gray-500 pt-1">
          Fixed: you set the order before the cycle starts. Ballot: each round,
          a draw picks the collector from those who have not yet collected.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-800 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
      >
        {isSubmitting ? "Creating group..." : "Create group"}
      </button>
    </form>
  );
}
