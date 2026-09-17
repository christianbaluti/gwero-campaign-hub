import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as CardContent, n as Button, r as Card, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as Input } from "./input-B7I4vy8H.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as useServerFn, r as syncReplies } from "./crm.functions-CpcA28n0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inbox-B9X6RAOO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InboxPage() {
	const qc = useQueryClient();
	const sync = useServerFn(syncReplies);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const { data: replies = [] } = useQuery({
		queryKey: ["replies"],
		queryFn: async () => {
			const { data, error } = await supabase.from("replies").select("*, prospects(first_name,last_name,company), campaigns(name)").order("received_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const shown = replies.filter((r) => `${r.from_email} ${r.subject} ${r.snippet}`.toLowerCase().includes(search.toLowerCase()));
	async function runSync() {
		setBusy(true);
		try {
			const result = await sync();
			toast.success(`Checked ${result.checked} accounts; imported ${result.imported} replies.`);
			await qc.invalidateQueries({ queryKey: ["replies"] });
		} catch (e) {
			toast.error(e.message);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Replies",
		description: "Responses collected from all connected inboxes.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: () => void runSync(),
			disabled: busy,
			children: busy ? "Checking…" : "Check for replies"
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			className: "mb-6 max-w-md",
			placeholder: "Search replies",
			value: search,
			onChange: (e) => setSearch(e.target.value)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "divide-y p-0",
			children: [shown.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: r.subject || "(No subject)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: [
							r.from_email,
							" ·",
							" ",
							r.campaigns?.name || "Direct reply"
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
						className: "text-xs text-muted-foreground",
						children: new Date(r.received_at).toLocaleString()
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm",
					children: r.snippet || "No preview available."
				})]
			}, r.id)), shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "p-10 text-center text-sm text-muted-foreground",
				children: "No replies found."
			}) : null]
		}) })]
	});
}
//#endregion
export { InboxPage as component };
