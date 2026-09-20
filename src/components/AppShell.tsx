import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
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

const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { to: "/clients", label: "Clients", icon: Building2 },
      { to: "/prospects", label: "Prospects", icon: Users },
      { to: "/campaigns", label: "Campaigns", icon: Send },
      { to: "/inbox", label: "Replies", icon: Inbox },
      { to: "/deals", label: "Deals", icon: Handshake },
      { to: "/quotations", label: "Quotations", icon: FileText },
      { to: "/cost-sheets", label: "Cost sheets", icon: Calculator },
      { to: "/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "Bidding",
    items: [
      { to: "/bids", label: "Bids", icon: Gavel },
      { to: "/prequalifications", label: "EOI / Prequalification", icon: BadgeCheck },
      { to: "/rfps", label: "RFPs", icon: FileQuestion },
      { to: "/rfqs", label: "RFQs", icon: FileInput },
    ],
  },
  {
    label: "Delivery",
    items: [
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/jobs", label: "Jobs", icon: Wrench },
      { to: "/tasks", label: "Tasks & Activities", icon: ListChecks },
      { to: "/procurement", label: "Procurement", icon: ShoppingCart },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/recruitment", label: "Recruitment", icon: UserPlus },
      { to: "/hr", label: "HR", icon: IdCard },
      { to: "/payroll", label: "Payroll", icon: Wallet },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/documents", label: "Documents", icon: Files },
      { to: "/finance", label: "Finance & Accounts", icon: Receipt },
      { to: "/agreements", label: "Agreements & SLAs", icon: FileSignature },
      { to: "/mailboxes", label: "Sending accounts", icon: Mail },
    ],
  },
] as const;

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
