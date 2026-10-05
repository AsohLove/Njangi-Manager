"use client";

import Link from "next/link";

const features = [
  {
    title: "Manage members",
    description:
      "Keep your group members and positions organized in one place.",
    icon: "👥",
  },
  {
    title: "Track contributions",
    description:
      "Record full and partial payments and see who has paid at a glance.",
    icon: "💰",
  },
  {
    title: "Manage rounds",
    description:
      "Follow collectors, due dates, payment status, and round progress.",
    icon: "🔄",
  },
  {
    title: "Handle fines & funds",
    description:
      "Track fines, fund income, spending, and the group's current balance.",
    icon: "📊",
  },
  {
    title: "Share group status",
    description:
      "Give members a simple way to check the latest group information.",
    icon: "🔗",
  },
  {
    title: "Keep records organized",
    description:
      "Replace scattered notebooks and manual calculations with structured records.",
    icon: "📋",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your group",
    description:
      "Set up your Njangi, contribution amount, frequency, and member positions.",
  },
  {
    number: "02",
    title: "Track each round",
    description:
      "Record contributions, monitor payment status, and manage fines as they happen.",
  },
  {
    number: "03",
    title: "Stay in control",
    description:
      "Follow payouts, fund activity, and group progress from one dashboard.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-emerald-50 text-slate-900">
     
      <header className="border-b border-slate-200 bg-white">
        {" "}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          {" "}
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight sm:text-xl"
          >
            Njangi <span className="text-blue-600">Manager</span>{" "}
          </Link>
          
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href="/login"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:px-4"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:px-4"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="overflow-hidden border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-28">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
              Simple Njangi management
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Manage your Njangi without the notebook headache.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
              Njangi Manager helps treasurers organize members, track
              contributions, manage rounds and payouts, handle fines, and keep
              the group fund records in one place.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-6 sm:py-3"
              >
                Create your group
              </Link>

              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-6 sm:py-3"
              >
                Log in
              </Link>
            </div>
          </div>

         
          <div className="mx-auto w-full max-w-xl lg:max-w-none">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-xl sm:p-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                      Current round
                    </p>
                    <h2 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                      Round 3
                    </h2>
                  </div>

                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 sm:px-3 sm:text-xs">
                    Open
                  </span>
                </div>

                <div className="py-4 sm:py-5">
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Current collector
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                    Member Position 3
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {[
                    ["Position 1", "Paid"],
                    ["Position 2", "Paid"],
                    ["Position 3", "Waiting"],
                    ["Position 4", "Paid"],
                  ].map(([position, status]) => (
                    <div
                      key={position}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3"
                    >
                      <span className="text-xs font-medium text-slate-700 sm:text-sm">
                        {position}
                      </span>

                      <span
                        className={`text-[10px] font-semibold sm:text-xs ${
                          status === "Paid"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
     
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 sm:text-sm">
              How it works
            </p>

            <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-950 sm:mt-3 sm:text-4xl">
              From setup to payout, all in one place.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base">
              Keep the process simple while making the group&apos;s records easier to
              manage and understand.
            </p>
          </div>

          <div className="mt-9 grid gap-5 sm:mt-12 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
              >
                <span className="text-sm font-bold text-blue-600">
                  {step.number}
                </span>

                <h3 className="mt-3 text-lg font-bold text-slate-900 sm:mt-4 sm:text-xl">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 sm:text-sm">
              Everything in one place
            </p>

            <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-950 sm:mt-3 sm:text-4xl">
              Built around the way Njangi groups actually work.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
              Keep the important records together instead of relying on
              notebooks, scattered messages, and manual calculations.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:mt-12 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-md sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg sm:h-11 sm:w-11 sm:text-xl">
                  {feature.icon}
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900 sm:mt-5 sm:text-lg">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="bg-slate-950 py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 sm:gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 sm:text-sm">
              Why Njangi Manager?
            </p>

            <h2 className="mt-2.5 text-2xl font-bold tracking-tight sm:mt-3 sm:text-4xl">
              Spend less time checking the notebook and more time managing the
              group.
            </h2>
          </div>

          <div>
            <p className="text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Njangi Manager gives treasurers a structured way to record what
              happens in the group. Payments, rounds, fines, payouts, and fund
              activity stay connected, making it easier to see the current state
              of the group.
            </p>
          </div>
        </div>
      </section>
      
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Ready to simplify your Njangi?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
            Create your group and start keeping your Njangi records organized.
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:mt-8 sm:py-3"
          >
            Get started
          </Link>
        </div>
      </section>
     
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8 sm:text-left">
          <p>
            © {new Date().getFullYear()} Njangi Manager. All rights reserved.
          </p>

          <div className="flex justify-center gap-5 sm:justify-end">
            <Link href="/login" className="hover:text-slate-900">
              Log in
            </Link>

            <Link href="/register" className="hover:text-slate-900">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
