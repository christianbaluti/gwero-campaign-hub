import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as money, i as CardContent, n as Button, r as Card, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as Input } from "./input-B7I4vy8H.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D6Lp5M71.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/deals-DSffiJ-4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var stages = [
	"new",
	"qualified",
	"proposal",
	"negotiation",
	"won",
	"lost"
];
function DealsPage() {
	const qc = useQueryClient();
	const [title, setTitle] = (0, import_react.useState)("");
	const [value, setValue] = (0, import_react.useState)("");
	const { data: deals = [] } = useQuery({
		queryKey: ["deals"],
		queryFn: async () => {
			const { data, error } = await supabase.from("deals").select("*, clients(name)").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!title.trim()) throw new Error("Deal title is required.");
			const { error } = await supabase.from("deals").insert({
				title: title.trim(),
				value: Number(value) || 0
			});
			if (error) throw error;
		},
		onSuccess: () => {
			setTitle("");
			setValue("");
			toast.success("Deal added.");
			qc.invalidateQueries({ queryKey: ["deals"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const move = useMutation({
		mutationFn: async ({ id, stage }) => {
			const { error } = await supabase.from("deals").update({ stage }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => void qc.invalidateQueries({ queryKey: ["deals"] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Deals",
		description: "Move opportunities through your sales pipeline.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "mb-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex flex-wrap gap-3 pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-xs",
						placeholder: "New deal",
						value: title,
						onChange: (e) => setTitle(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-40",
						type: "number",
						placeholder: "Value",
						value,
						onChange: (e) => setValue(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => create.mutate(),
						children: "Add deal"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 xl:grid-cols-3 2xl:grid-cols-6",
			children: stages.map((stage) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-muted/60 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold capitalize",
						children: stage
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: deals.filter((d) => d.stage === stage).length
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: deals.filter((d) => d.stage === stage).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: d.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: d.clients?.name || "Unassigned"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "my-3 font-semibold",
								children: money(d.value, d.currency)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: d.stage,
								onValueChange: (next) => move.mutate({
									id: d.id,
									stage: next
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-8",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: stages.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: s,
									children: s
								}, s)) })]
							})
						]
					}) }, d.id))
				})]
			}, stage))
		})]
	});
}
//#endregion
export { DealsPage as component };
