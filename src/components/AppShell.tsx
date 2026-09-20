import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Send,
  Inbox,
  Building2,
  Handshake,
  FileSignature,
  Mail,
  FileText,
  Calculator,
  Megaphone,
  Gavel,
  BadgeCheck,
  FileQuestion,
  FileInput,
  FolderKanban,
  Wrench,
  ListChecks,
  ShoppingCart,
  Files,
  UserPlus,
  IdCard,
  Wallet,
  Receipt,
  Search,
  Bell,
  CircleHelp,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: LucideIcon };
const nav = (to: string, label: string, icon: LucideIcon): NavItem => ({ to, label, icon });

const navGroups = [
  {
    label: "Overview",
    items: [nav("/", "Dashboard", LayoutDashboard)],
  },
  {
    label: "Sales",
    items: [
      nav("/clients", "Clients", Building2),
      nav("/prospects", "Prospects", Users),
      nav("/campaigns", "Campaigns", Send),
      nav("/inbox", "Replies", Inbox),
      nav("/deals", "Deals", Handshake),
      nav("/quotations", "Quotations", FileText),
      nav("/cost-sheets", "Cost sheets", Calculator),
      nav("/marketing", "Marketing", Megaphone),
    ],
  },
  {
    label: "Bidding",
    items: [
      nav("/bids", "Bids", Gavel),
      nav("/prequalifications", "EOI / Prequalification", BadgeCheck),
      nav("/rfps", "RFPs", FileQuestion),
      nav("/rfqs", "RFQs", FileInput),
    ],
  },
  {
    label: "Delivery",
    items: [
      nav("/projects", "Projects", FolderKanban),
      nav("/jobs", "Jobs", Wrench),
      nav("/tasks", "Tasks & Activities", ListChecks),
      nav("/procurement", "Procurement", ShoppingCart),
    ],
  },
  {
    label: "People",
    items: [
      nav("/recruitment", "Recruitment", UserPlus),
      nav("/hr", "HR", IdCard),
      nav("/payroll", "Payroll", Wallet),
    ],
  },
  {
    label: "Business",
    items: [
      nav("/documents", "Documents", Files),
      nav("/finance", "Finance & Accounts", Receipt),
      nav("/agreements", "Agreements & SLAs", FileSignature),
      nav("/mailboxes", "Sending accounts", Mail),
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#faf9fd]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-violet-100 bg-white md:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5b21b6] text-sm font-black text-white shadow-lg shadow-violet-200">
            G
          </div>
          <div>
            <span className="font-display text-xl font-bold text-[#28104f]">Gwero</span>
            <p className="text-[11px] font-medium text-violet-500">Operations system</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as never}
                  activeOptions={{ exact: item.to === "/" }}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-800"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold bg-violet-100 text-violet-800",
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="m-4 rounded-2xl bg-gradient-to-br from-[#f5efff] to-[#ede4ff] p-4">
          <p className="font-semibold text-[#321568]">Build better business.</p>
          <p className="mt-1 text-xs leading-5 text-violet-600">One connected operating system.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 items-center gap-4 border-b border-violet-100 bg-white px-5 md:px-8">
          <div className="relative hidden max-w-xl flex-1 lg:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
              placeholder="Search across Gwero OS…"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label="Help" className="rounded-xl p-2 text-slate-500 hover:bg-violet-50">
              <CircleHelp className="size-5" />
            </button>
            <button
              aria-label="Notifications"
              className="relative rounded-xl p-2 text-slate-500 hover:bg-violet-50"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full border border-white bg-rose-500" />
            </button>
            <div className="ml-2 grid size-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-800">
              GA
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold">Gwero Admin</p>
              <p className="text-[10px] text-muted-foreground">Business operations</p>
            </div>
          </div>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
          {allItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as never}
              activeOptions={{ exact: item.to === "/" }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground"
              activeProps={{
                className:
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-7">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#21143f] md:text-3xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function money(value: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}
