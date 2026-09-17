import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as money, i as CardContent, n as Button, r as Card, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as Badge } from "./badge-Ci6XGb5B.mjs";
import { t as Input } from "./input-B7I4vy8H.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D6Lp5M71.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agreements-B-x2N1Z0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AgreementsPage() {
	const qc = useQueryClient();
	const [title, setTitle] = (0, import_react.useState)("");
	const [clientId, setClientId] = (0, import_react.useState)("");
	const { data: clients = [] } = useQuery({
		queryKey: ["clients"],
		queryFn: async () => {
			const { data, error } = await supabase.from("clients").select("id,name").order("name");
			if (error) throw error;
			return data;
		}
	});
	const { data: agreements = [] } = useQuery({
		queryKey: ["agreements"],
		queryFn: async () => {
			const { data, error } = await supabase.from("agreements").select("*, clients(name)").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!title.trim() || !clientId) throw new Error("Choose a client and enter a title.");
			const { error } = await supabase.from("agreements").insert({
				title: title.trim(),
				client_id: clientId
			});
			if (error) throw error;
		},
		onSuccess: () => {
			setTitle("");
			toast.success("Agreement added.");
			qc.invalidateQueries({ queryKey: ["agreements"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Agreements & SLAs",
		description: "Track contracts, service commitments and renewals.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "mb-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex flex-wrap gap-3 pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-xs",
						placeholder: "Agreement title",
						value: title,
						onChange: (e) => setTitle(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: clientId,
						onValueChange: setClientId,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "max-w-xs",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose client" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: clients.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: c.id,
							children: c.name
						}, c.id)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => create.mutate(),
						children: "Add agreement"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
			children: [agreements.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: a.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: a.clients?.name
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						children: a.status
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-5 grid grid-cols-2 gap-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Type"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "capitalize",
							children: a.agreement_type
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Value"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: money(a.value, a.currency) })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Response"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: a.response_time_hours ? `${a.response_time_hours} hours` : "Not set" })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted-foreground",
							children: "Renews"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: a.auto_renew ? "Automatically" : a.end_date || "Not set" })] })
					]
				})]
			}) }, a.id)), agreements.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No agreements yet."
			}) : null]
		})]
	});
}
//#endregion
export { AgreementsPage as component };
