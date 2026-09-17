import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  CircleHelp,
  ContactRound,
  FileUp,
  Inbox,
  LayoutDashboard,
  Mail,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

const campaigns = [
  {
    name: "Q3 Partnership Outreach",
    audience: "Technology Leaders",
    sent: 284,
    open: 68,
    reply: 12,
    status: "Active",
  },
  {
    name: "SME Growth Programme",
    audience: "Malawi SMEs",
    sent: 196,
    open: 61,
    reply: 9,
    status: "Active",
  },
  {
    name: "August Follow-up",
    audience: "Warm prospects",
    sent: 83,
    open: 74,
    reply: 18,
    status: "Completed",
  },
];

const nav = [
  ["Overview", LayoutDashboard],
  ["Prospects", ContactRound],
  ["Campaigns", Send],
  ["Inbox", Inbox],
  ["Analytics", BarChart3],
  ["Mailboxes", Mail],
] as const;

function Index() {
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState(false);
  const filtered = useMemo(
    () =>
      campaigns.filter((c) =>
        `${c.name} ${c.audience}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-200">
            G
          </div>
          <div>
            <p className="text-lg font-bold leading-5">Gwero</p>
            <p className="text-xs font-medium text-slate-400">Campaign Hub</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">
            Workspace
          </p>
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active === label ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
            >
              <Icon className="size-[18px]" />
              {label}
              {label === "Inbox" && (
                <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">
                  7
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Settings className="size-[18px]" />
            Settings
          </button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
              GG
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Gwero Team</p>
              <p className="truncate text-xs text-slate-400">Administrator</p>
            </div>
            <ChevronDown className="size-4 text-slate-400" />
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8">
          <button
            className="rounded-lg border border-slate-200 p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              placeholder="Search campaigns and prospects…"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Help"
              className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100"
            >
              <CircleHelp className="size-5" />
            </button>
            <button
              aria-label="Notifications"
              className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" />
            </button>
            <button
              onClick={() => setComposer(true)}
              className="ml-1 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">New campaign</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 md:p-8">
          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-sm font-semibold text-blue-600">Tuesday, 9 September</p>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Good morning, Gwero team
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Here’s how your outreach is performing today.
              </p>
            </div>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm hover:bg-slate-50">
              <FileUp className="size-4" />
              Import prospects
            </button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["Total prospects", "1,248", "+84 this month", Users, "blue"],
                ["Emails sent", "563", "+12.4%", Send, "violet"],
                ["Average open rate", "67.2%", "+5.8%", Target, "emerald"],
                ["Replies received", "74", "13.1% reply rate", Inbox, "amber"],
              ] as const
            ).map(([label, value, detail, Icon]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
                  </div>
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="size-5" />
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold text-emerald-600">{detail}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="font-bold">Campaign performance</h2>
                  <p className="mt-1 text-xs text-slate-400">Recent outreach activity</p>
                </div>
                <button className="text-sm font-semibold text-blue-600">View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 font-bold">Campaign</th>
                      <th className="px-4 py-3 font-bold">Sent</th>
                      <th className="px-4 py-3 font-bold">Open rate</th>
                      <th className="px-4 py-3 font-bold">Replies</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.name} className="border-t border-slate-100 text-sm">
                        <td className="px-5 py-4">
                          <p className="font-semibold">{c.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{c.audience}</p>
                        </td>
                        <td className="px-4 py-4 font-medium">{c.sent}</td>
                        <td className="px-4 py-4">
                          <span className="font-semibold">{c.open}%</span>
                          <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${c.open}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium">{c.reply}%</td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="pr-4">
                          <button className="rounded-lg p-2 hover:bg-slate-50">
                            <MoreHorizontal className="size-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Recent activity</h2>
                  <p className="mt-1 text-xs text-slate-400">Latest engagement</p>
                </div>
                <button className="rounded-lg p-2 hover:bg-slate-50">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
              <div className="mt-5 space-y-5">
                {[
                  [
                    "TN",
                    "Thoko Nyirenda replied",
                    "Q3 Partnership Outreach",
                    "8 min ago",
                    "emerald",
                  ],
                  ["CM", "Chikondi Mbewe opened", "SME Growth Programme", "24 min ago", "blue"],
                  [
                    "FM",
                    "Frank Moyo clicked a link",
                    "Q3 Partnership Outreach",
                    "1 hr ago",
                    "violet",
                  ],
                  ["AG", "Agnes Gondwe replied", "August Follow-up", "3 hrs ago", "amber"],
                ].map(([initials, action, campaign, time]) => (
                  <div key={action} className="flex gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{action}</p>
                      <p className="truncate text-xs text-slate-400">{campaign}</p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-slate-400">{time}</span>
                  </div>
                ))}
              </div>
              <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Open inbox <ArrowUpRight className="size-4" />
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-lg shadow-blue-100 md:flex md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="font-bold">Ready for your next conversation?</h2>
                <p className="mt-1 max-w-xl text-sm text-blue-100">
                  Import a prospect list, personalise your message, and start a campaign in minutes.
                </p>
              </div>
            </div>
            <button
              onClick={() => setComposer(true)}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-700 md:mt-0"
            >
              Create campaign <ArrowUpRight className="size-4" />
            </button>
          </section>
        </div>
      </main>

      {composer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Create a campaign</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set up the basics. You can add recipients next.
                </p>
              </div>
              <button
                onClick={() => setComposer(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                Campaign name
                <input
                  autoFocus
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="e.g. September partner outreach"
                />
              </label>
              <label className="block text-sm font-semibold">
                Email subject
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="A quick introduction from Gwero"
                />
              </label>
              <label className="block text-sm font-semibold">
                Audience
                <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none">
                  <option>All prospects</option>
                  <option>New prospects</option>
                  <option>Warm prospects</option>
                </select>
              </label>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setComposer(false)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setComposer(false)}
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
              >
                Save draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
