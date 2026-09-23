"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { createMember } from "@/lib/api-client";

export default function NewMemberPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const groupId = Number(params.id);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createMember(groupId, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["group", groupId],
      });

      router.push(`/groups/${groupId}/members`);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim()) return;

    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-800 px-5 py-4 text-white">
        <div className="flex items-center gap-4">
          <Link
            href={`/groups/${groupId}/members`}
            className="text-2xl"
          >
            ‹
          </Link>

          <div>
            <h1 className="text-lg font-bold">Add member</h1>
            <p className="text-sm text-emerald-100">
              Add someone to this Njangi
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. Marie"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm text-slate-900 bg-white outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Phone number
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. 6XXXXXXXX"
                className="w-full rounded-md border border-slate-300 px-3 py-3 text-sm text-slate-900 bg-white outline-none focus:border-emerald-700"
              />

              <p className="mt-1 text-xs text-slate-500">
                Stored for the treasurer but never shown on the share page.
              </p>
            </div>

            {createMutation.isError && (
              <p className="text-sm text-red-600">
                {createMutation.error.message}
              </p>
            )}

            <button
              type="submit"
              disabled={
                !fullName.trim() || createMutation.isPending
              }
              className="w-full rounded-md bg-emerald-800 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {createMutation.isPending
                ? "Adding member..."
                : "Add member"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}