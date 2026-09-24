"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCreateRule } from "@/hooks/useCollection";

interface CreateRuleDrawerProps {
  amount: number
  groupId: number;
}

export function CreateRuleDrawer({ groupId, amount }: CreateRuleDrawerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [defaultAmount, setDefaultAmount] = useState<number | string>(amount);

  const { mutate: createRule, isPending } = useCreateRule(groupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(defaultAmount);

    if (!name.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    createRule(
      {
        name: name.trim(),
        default_amount: numericAmount,
      },
      {
        onSuccess: () => {
          setName("");
          setDefaultAmount("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        type="button"
        className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 text-emerald-900 font-semibold text-xs transition-colors"
      >
        + Add rule
      </DrawerTrigger>

      <DrawerContent className="p-0 bg-white border-t rounded-t-2xl">
        <div className="mx-auto w-full max-w-sm p-5 space-y-4">
          <DrawerHeader className="p-0 text-left space-y-1">
            <DrawerTitle className="text-lg font-bold text-slate-900">
              Create Fine Rule
            </DrawerTitle>
            <p className="text-xs font-medium text-slate-500">
              Set standard penalties for late or missed contributions.
            </p>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="rule-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Rule Title
              </label>
              <input
                id="rule-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Due date fine"
                required
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="default-amount"
                className="block text-xs font-semibold text-slate-700"
              >
                Default Amount (FCFA)
              </label>
              <input
                id="default-amount"
                type="number"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                placeholder="3000"
                required
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving rule..." : "Save Fine Rule"}
              </button>

              <DrawerClose
                type="button"
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                Cancel
              </DrawerClose>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
