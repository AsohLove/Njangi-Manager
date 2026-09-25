"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { GroupForm } from "@/components/forms/groupForm";
import { useCreateGroup } from "@/hooks/useCollection";

export default function CreateGroupPage() {
  const createGroup = useCreateGroup();
  const router = useRouter();

  const handleSubmit = (payload: Parameters<typeof createGroup.mutate>[0]) => {
    createGroup.mutate(payload, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  return (
    <div className="space-y-4 w-full h-screen">
      <Card>
        <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <ArrowLeft size={20} />
          </Link>
          Create a group
        </h1>
      </Card>

      <GroupForm isSubmitting={createGroup.isPending} onSubmit={handleSubmit} />
    </div>
  );
}
