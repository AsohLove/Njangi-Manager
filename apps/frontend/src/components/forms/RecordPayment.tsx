"use client";

import * as React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCreatePayment, useUpdatePayment } from "@/hooks/useCollection";

interface RecordPaymentDrawerProps {
  groupId: number;
  roundId: number;
  roundNumber: number;
  positionId: number;
  positionNumber: number;
  memberName: string;
  defaultAmount: number;
  paymentId?: number;
  currentAmount?: number;
}

export function RecordPaymentDrawer({
  groupId,
  roundId,
  roundNumber,
  positionId,
  positionNumber,
  memberName,
  defaultAmount,
  paymentId,
  currentAmount = 0,
}: RecordPaymentDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState<number | string>(
    paymentId !== undefined ? defaultAmount - currentAmount : defaultAmount,
  );
  const [error, setError] = React.useState("");

  const { mutate: recordPayment, isPending } = useCreatePayment(groupId);
  const { mutate: updatePayment, isPending: isUpdating } = useUpdatePayment(
    groupId,
  );
  const isUpdate = paymentId !== undefined;
  const isPendingRequest = isPending || isUpdating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    setError("");
    const onSuccess = () => setOpen(false);
    const onError = (requestError: Error) => {
      setError(requestError.message || "Unable to save payment. Please try again.");
    };

    if (isUpdate) {
      updatePayment(
        { paymentId, payload: { amount: numericAmount } },
        { onSuccess, onError },
      );
      return;
    }

    recordPayment(
      {
        roundId,
        payload: { position_id: positionId, amount: numericAmount },
      },
      { onSuccess, onError },
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setError("");
      }}
    >
      <DrawerTrigger
        type="button"
        className="bg-emerald-900/10 text-emerald-950 font-semibold rounded-md px-3 py-1.5 text-xs transition-colors"
      >
        Record
      </DrawerTrigger>

      <DrawerContent className="p-0 bg-white border-t rounded-t-[20px]">
        <div className="w-full p-4 space-y-4">
          <DrawerHeader className="p-0 text-left space-y-1">
            <DrawerTitle className="text-lg font-bold text-slate-900">
              {isUpdate ? "Update payment" : "Record payment"} · {memberName}
            </DrawerTitle>
            <p className="text-xs font-medium text-slate-500">
              Position {positionNumber} · Round {roundNumber}
            </p>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="amount"
                className="block text-xs font-semibold text-slate-700"
              >
                {isUpdate ? "Additional amount (FCFA)" : "Amount (FCFA)"}
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5 000"
                required
                className="w-full h-11 px-3 rounded-lg border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900"
              />
              {isUpdate && (
                <p className="text-xs font-medium text-slate-500">
                  Amount left: {(defaultAmount - currentAmount).toLocaleString()} FCFA
                </p>
              )}
              {error && (
                <p role="alert" className="text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isPendingRequest}
                className="w-full h-12 bg-[#1b4332] hover:bg-[#143326] text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isPendingRequest
                  ? isUpdate
                    ? "Updating..."
                    : "Recording..."
                  : isUpdate
                    ? "Update payment"
                    : "Record payment"}
              </button>

              <DrawerClose
                type="button"
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-sm transition-colors text-center flex items-center justify-center"
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
