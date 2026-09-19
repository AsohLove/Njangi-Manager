"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient} from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";

import { registerAdmin } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient()

  const registerMutation = useMutation({
    mutationFn: registerAdmin,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth-user"], data);
      
      setError("");
      router.push("/");
    },
    onError: (err) => {
      setError(
        err?.message || "Registration failed",
      );
    },
  });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({ email, password, full_name: name });
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center font-sans">
      <div className="w-full bg-emerald-50/20 overflow-hidden flex flex-col min-h-[580px]">
        <Card>
          <h1 className="text-xl font-bold leading-tight">Njangi Manager</h1>
          <p className="text-xs text-emerald-100/90 mt-0.5 font-normal">
            The group&apos;s book, on every phone
          </p>
        </Card>

        <div className="p-4 flex-1 flex flex-col">
          <div className="bg-white rounded-lg border border-gray-200/80 p-4 shadow-sm">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md outline-none focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rose@example.cm"
                  required
                  className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md outline-none focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md outline-none focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 transition-colors pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full py-2.5 mt-1 bg-emerald-900 hover:bg-emerald-950 text-white font-medium text-sm rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
              >
                {registerMutation.isPending ? "Registering..." : "Register"}
              </button>
            </form>

            <div className="text-center mt-3 pt-1">
              <span className="text-xs text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-900 font-semibold hover:underline"
                >
                  Login
                </Link>
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500 leading-relaxed px-0.5">
            Only treasurers log in. Members use the group&apos;s share link, no
            account needed.
          </p>
        </div>
      </div>
    </div>
  );
}
