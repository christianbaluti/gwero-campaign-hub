import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Megaphone,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { AppShell, money } from "@/components/AppShell";
import { db } from "@/lib/db";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });
type Metric = {
  label: string;
  value: number;
  hint: string;
  to: string;
  icon: typeof Users;
  tone: string;
};

async function loadDashboard() {
  const [
    clientResult,
    projectResult,
    taskResult,
    bidResult,
    quoteResult,
    campaignResult,
    employeeResult,
    invoiceResult,
  ] = await Promise.all([
    db.from("clients").select("*").order("created_at", { ascending: false }).limit(8),
    db.from("projects").select("*").order("created_at", { ascending: false }).limit(8),
    db.from("tasks").select("*").order("created_at", { ascending: false }).limit(8),
    db.from("bids").select("*").order("created_at", { ascending: false }).limit(8),
    db.from("quotations").select("*").order("created_at", { ascending: false }).limit(8),
    db.from("campaigns").select("*").order("created_at", { ascending: false }).limit(8),
    db.from("employees").select("*").order("created_at", { ascending: false }).limit(8),
    db.from("invoices").select("*").order("created_at", { ascending: false }).limit(8),
  ]);
  const failed = [
    clientResult,
    projectResult,
    taskResult,
    bidResult,
    quoteResult,
    campaignResult,
    employeeResult,
    invoiceResult,
  ].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  const clients = clientResult.data,
    projects = projectResult.data,
    tasks = taskResult.data,
    bids = bidResult.data,
    quotations = quoteResult.data,
    campaigns = campaignResult.data,
    employees = employeeResult.data,
    invoices = invoiceResult.data;
  return { clients, projects, tasks, bids, quotations, campaigns, employees, invoices };
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["gwero-os-dashboard"],
    queryFn: loadDashboard,
  });
  const openTasks = data?.tasks.filter((t) => t.status !== "done").length ?? 0;
  const activeProjects =
    data?.projects.filter((p) => !["completed", "cancelled"].includes(p.status)).length ?? 0;
  const openBids =
    data?.bids.filter((b) => !["won", "lost", "withdrawn"].includes(b.status)).length ?? 0;
  const outstanding =
    data?.invoices.reduce(
      (sum, i) => sum + Math.max(0, Number(i.amount) - Number(i.paid_amount)),
      0,
    ) ?? 0;
  const metrics: Metric[] = [
    {
      label: "Active clients",
      value: data?.clients.filter((c) => c.status === "active").length ?? 0,
      hint: "relationships in progress",
      to: "/clients",
      icon: Building2,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Active projects",
      value: activeProjects,
      hint: "delivery workspaces",
      to: "/projects",
      icon: FolderKanban,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Open tasks",
      value: openTasks,
      hint: "items needing action",
      to: "/tasks",
      icon: ClipboardCheck,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Open bids",
      value: openBids,
      hint: "opportunities in pipeline",
      to: "/bids",
      icon: BriefcaseBusiness,
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];
  return (
    <AppShell
      title="Good morning, Gwero team"
      description="Here is what is happening across the business today."
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        ) : null}
        <section className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-r from-[#f8f4ff] via-white to-[#f4edff] p-6 md:p-8">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-600">
              Gwero OS · Business operations
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#21143f] md:text-4xl">
              One workspace. Every moving part.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Move opportunities from sourcing and bids through delivery, people, procurement and
              finance.
            </p>
          </div>
          <div className="absolute -right-10 -top-16 size-56 rounded-full bg-violet-200/50" />
          <div className="absolute right-36 top-14 size-28 rounded-full bg-fuchsia-100/60" />
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Your workspace today</h2>
            <span className="text-xs text-muted-foreground">
              {isLoading ? "Updating…" : "Live from MySQL"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, hint, to, icon: Icon, tone }) => (
              <Link
                key={label}
                to={to as never}
                className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
                </div>
                <p className="mt-4 text-3xl font-bold text-[#21143f]">{isLoading ? "—" : value}</p>
                <p className="mt-1 text-sm font-semibold">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-bold">Needs your attention</h2>
                <p className="mt-1 text-xs text-muted-foreground">Open work across teams</p>
              </div>
              <Link to="/tasks" className="text-sm font-semibold text-violet-700">
                View all
              </Link>
            </div>
            <div className="divide-y">
              {(data?.tasks.slice(0, 6) ?? []).map((task) => (
                <Link
                  to="/tasks"
                  key={task.id}
                  className="flex items-center gap-4 p-4 transition hover:bg-violet-50/40"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.assignee || "Unassigned"} · {task.entity_type}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
                    {task.status.replace("_", " ")}
                  </span>
                </Link>
              ))}
              {!isLoading && !data?.tasks.length ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No open work yet. Create a task to get the team moving.
                </div>
              ) : null}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="font-bold">Quick actions</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(
                  [
                    ["/quotations", "Quotation", FileText],
                    ["/projects", "Project", FolderKanban],
                    ["/tasks", "Task", ClipboardCheck],
                    ["/campaigns", "Campaign", Send],
                  ] as Array<[string, string, LucideIcon]>
                ).map(([to, label, Icon]) => (
                  <Link
                    key={String(to)}
                    to={to as never}
                    className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border bg-[#fbf9ff] text-sm font-semibold text-[#321568] transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <Icon className="size-5" />
                    <span>
                      <Plus className="mr-1 inline size-3" />
                      {label as string}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="font-bold">Financial snapshot</h2>
              <div className="mt-4 flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CircleDollarSign className="size-6" />
                </span>
                <div>
                  <p className="text-2xl font-bold">{money(outstanding, "MWK")}</p>
                  <p className="text-xs text-muted-foreground">Outstanding on recent invoices</p>
                </div>
              </div>
              <Link
                to="/finance"
                className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold"
              >
                Open finance <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Explore Gwero OS</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(
              [
                ["/marketing", "Marketing", Megaphone],
                ["/recruitment", "Recruitment", Users],
                ["/hr", "HR", Users],
                ["/payroll", "Payroll", CalendarDays],
                ["/procurement", "Procurement", BriefcaseBusiness],
                ["/documents", "Documents", FileText],
              ] as Array<[string, string, LucideIcon]>
            ).map(([to, label, Icon]) => (
              <Link
                key={String(to)}
                to={to as never}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-semibold transition hover:border-violet-300 hover:text-violet-700"
              >
                <Icon className="size-5 text-violet-600" />
                {label as string}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
