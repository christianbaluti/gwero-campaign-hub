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
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-PceKd7UZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaigns.index-BrovVX0z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CampaignsPage() {
	const qc = useQueryClient();
	const [name, setName] = (0, import_react.useState)("");
	const { data: campaigns = [] } = useQuery({
		queryKey: ["campaigns"],
		queryFn: async () => {
			const { data, error } = await supabase.from("campaigns").select("*, campaign_recipients(status)").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			const { data, error } = await supabase.from("campaigns").insert({
				name: name || "Untitled campaign",
				subject: "",
				body_html: ""
			}).select().single();
			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			setName("");
			toast.success("Campaign created.");
			qc.invalidateQueries({ queryKey: ["campaigns"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Campaigns",
		description: "Mass emails to your prospect lists.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "mb-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex flex-wrap items-center gap-3 pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "max-w-sm",
					placeholder: "New campaign name",
					value: name,
					onChange: (e) => setName(e.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => create.mutate(),
					children: "Create campaign"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "overflow-x-auto pt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Subject" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Recipients" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Sent" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [campaigns.map((c) => {
				const recipients = c.campaign_recipients ?? [];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/campaigns/$id",
						params: { id: c.id },
						className: "font-medium text-primary hover:underline",
						children: c.name
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "max-w-xs truncate",
						children: c.subject || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: c.status === "sent" ? "default" : "secondary",
						children: c.status
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: recipients.length }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: recipients.filter((r) => r.status === "sent").length })
				] }, c.id);
			}), campaigns.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				colSpan: 5,
				className: "py-10 text-center text-muted-foreground",
				children: "No campaigns yet."
			}) }) : null] })] })
		}) })]
	});
}
//#endregion
export { CampaignsPage as component };
