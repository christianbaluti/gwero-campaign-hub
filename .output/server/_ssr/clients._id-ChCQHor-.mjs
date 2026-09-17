import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as CardHeader, c as money, i as CardContent, n as Button, o as CardTitle, r as Card, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-tHeXRFzh.mjs";
import { t as Route } from "./clients._id-_IqAKani.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients._id-ChCQHor-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClientDetail() {
	const { id } = Route.useParams();
	const qc = useQueryClient();
	const [note, setNote] = (0, import_react.useState)("");
	const { data: client } = useQuery({
		queryKey: ["client", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
			if (error) throw error;
			return data;
		}
	});
	const { data: deals = [] } = useQuery({
		queryKey: ["client-deals", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("deals").select("*").eq("client_id", id).order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const { data: agreements = [] } = useQuery({
		queryKey: ["client-agreements", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("agreements").select("*").eq("client_id", id).order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const { data: activities = [] } = useQuery({
		queryKey: [
			"activities",
			"client",
			id
		],
		queryFn: async () => {
			const { data, error } = await supabase.from("activities").select("*").eq("entity_type", "client").eq("entity_id", id).order("occurred_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const addNote = useMutation({
		mutationFn: async () => {
			if (!note.trim()) throw new Error("Write a note first.");
			const { error } = await supabase.from("activities").insert({
				entity_type: "client",
				entity_id: id,
				activity_type: "note",
				body: note.trim()
			});
			if (error) throw error;
		},
		onSuccess: () => {
			setNote("");
			toast.success("Activity added.");
			qc.invalidateQueries({ queryKey: [
				"activities",
				"client",
				id
			] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: client?.name ?? "Client",
		description: client?.company || "Client account",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/clients",
				children: "Back to clients"
			})
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[1fr_1.5fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Contact" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: client?.email || "No email" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: client?.phone || "No phone" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: client?.website || "No website" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: client?.address || "No address"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Open deals" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [deals.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between border-b pb-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: d.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: money(d.value, d.currency) })]
						}, d.id)), deals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No deals."
						}) : null]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Agreements & SLAs" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [agreements.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between border-b pb-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: a.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "capitalize",
								children: a.status
							})]
						}, a.id)), agreements.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No agreements."
						}) : null]
					})] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Activity timeline" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					placeholder: "Add a meeting, call or account note…",
					value: note,
					onChange: (e) => setNote(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-3",
					onClick: () => addNote.mutate(),
					children: "Add note"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-4",
					children: [activities.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-l-2 border-primary/30 pl-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: a.body
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: new Date(a.occurred_at).toLocaleString()
						})]
					}, a.id)), activities.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No activity recorded yet."
					}) : null]
				})
			] })] })]
		})
	});
}
//#endregion
export { ClientDetail as component };
