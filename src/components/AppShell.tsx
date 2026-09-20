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
} from "lucide-react";

const nav = <T extends string>(to: T, label: string, icon: LucideIcon) => ({ to, label, icon });

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
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            G
          </div>
          <span className="font-display text-lg font-semibold">Gwero OS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <p className="px-6 py-4 text-xs text-muted-foreground">MSP business operations</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-border bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
          {allItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
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
        <main className="flex-1 p-6">{children}</main>
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
