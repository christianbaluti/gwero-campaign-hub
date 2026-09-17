import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as CardContent, n as Button, r as Card, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as Badge } from "./badge-Ci6XGb5B.mjs";
import { t as Input } from "./input-B7I4vy8H.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients-C1BZzHuz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClientsPage() {
	const qc = useQueryClient();
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const { data: clients = [] } = useQuery({
		queryKey: ["clients"],
		queryFn: async () => {
			const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!name.trim()) throw new Error("Client name is required.");
			const { error } = await supabase.from("clients").insert({
				name: name.trim(),
				email: email.trim() || null
			});
			if (error) throw error;
		},
		onSuccess: () => {
			setName("");
			setEmail("");
			toast.success("Client added.");
			qc.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Clients",
		description: "Companies and people you actively serve.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "mb-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex flex-wrap gap-3 pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-xs",
						placeholder: "Client name",
						value: name,
						onChange: (e) => setName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-xs",
						type: "email",
						placeholder: "Email address",
						value: email,
						onChange: (e) => setEmail(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => create.mutate(),
						disabled: create.isPending,
						children: "Add client"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
			children: [clients.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/clients/$id",
				params: { id: c.id },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "h-full transition hover:border-primary/40 hover:shadow-raised",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "pt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-semibold",
								children: c.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted-foreground",
								children: c.company || c.email || "No contact details"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "secondary",
								children: c.status
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-sm text-muted-foreground",
							children: c.industry || "Industry not set"
						})]
					})
				})
			}, c.id)), clients.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No clients yet. Convert a prospect or add one above."
			}) : null]
		})]
	});
}
//#endregion
export { ClientsPage as component };
