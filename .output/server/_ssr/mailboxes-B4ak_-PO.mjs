import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as CardHeader, i as CardContent, n as Button, o as CardTitle, r as Card, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as Badge } from "./badge-Ci6XGb5B.mjs";
import { t as Input } from "./input-B7I4vy8H.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as useServerFn, i as testMailbox, t as saveMailboxCredentials } from "./crm.functions-CpcA28n0.mjs";
import { t as Label } from "./label-BAtza3LO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/mailboxes-B4ak_-PO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MailboxesPage() {
	const qc = useQueryClient();
	const saveSecrets = useServerFn(saveMailboxCredentials);
	const test = useServerFn(testMailbox);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		email: "",
		smtpHost: "",
		smtpPort: "587",
		username: "",
		password: "",
		imapHost: "",
		imapPort: "993"
	});
	const { data: mailboxes = [] } = useQuery({
		queryKey: ["mailboxes"],
		queryFn: async () => {
			const { data, error } = await supabase.from("mailboxes").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const create = useMutation({
		mutationFn: async () => {
			if (!form.name || !form.email || !form.smtpHost || !form.username || !form.password) throw new Error("Complete the required SMTP fields.");
			const { data, error } = await supabase.from("mailboxes").insert({
				name: form.name,
				from_email: form.email,
				provider: "smtp",
				smtp_host: form.smtpHost,
				smtp_port: Number(form.smtpPort),
				smtp_username: form.username,
				smtp_secure: Number(form.smtpPort) === 465,
				imap_host: form.imapHost || null,
				imap_port: Number(form.imapPort),
				imap_username: form.username
			}).select().single();
			if (error) throw error;
			await saveSecrets({ data: {
				mailboxId: data.id,
				smtpPassword: form.password,
				imapPassword: form.password
			} });
		},
		onSuccess: () => {
			toast.success("Sending account saved.");
			setForm({
				name: "",
				email: "",
				smtpHost: "",
				smtpPort: "587",
				username: "",
				password: "",
				imapHost: "",
				imapPort: "993"
			});
			qc.invalidateQueries({ queryKey: ["mailboxes"] });
		},
		onError: (e) => toast.error(e.message)
	});
	async function check(id) {
		try {
			const result = await test({ data: { mailboxId: id } });
			toast.success(result.message);
			qc.invalidateQueries({ queryKey: ["mailboxes"] });
		} catch (e) {
			toast.error(e.message);
		}
	}
	const set = (key) => (e) => setForm((f) => ({
		...f,
		[key]: e.target.value
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Sending accounts",
		description: "Connect SMTP/IMAP or authorize Gmail and Microsoft 365.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_1.4fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Connect with OAuth" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							variant: "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/api/oauth/google/start",
								children: "Connect Gmail"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							variant: "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/api/oauth/microsoft/start",
								children: "Connect Microsoft 365 / Outlook"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "OAuth client IDs and secrets must be configured on the server."
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Add SMTP / IMAP account" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "grid gap-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Account name *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.name,
							onChange: set("name")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "From email *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "email",
							value: form.email,
							onChange: set("email")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "SMTP host *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.smtpHost,
							onChange: set("smtpHost")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "SMTP port" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.smtpPort,
							onChange: set("smtpPort")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Username *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.username,
							onChange: set("username")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Password *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "password",
							value: form.password,
							onChange: set("password")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "IMAP host" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.imapHost,
							onChange: set("imapHost")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "IMAP port" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.imapPort,
							onChange: set("imapPort")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "sm:col-span-2",
							onClick: () => create.mutate(),
							disabled: create.isPending,
							children: "Save account"
						})
					]
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [mailboxes.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex flex-wrap items-center gap-4 pt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-semibold",
									children: m.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									children: m.provider
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: m.from_email
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: m.last_status || "Not tested yet"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => void check(m.id),
						children: "Test connection"
					})]
				}) }, m.id)), mailboxes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "No sending accounts connected yet."
				}) : null]
			})]
		})
	});
}
//#endregion
export { MailboxesPage as component };
