import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as CardHeader, i as CardContent, n as Button, o as CardTitle, r as Card, s as cn, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as Badge } from "./badge-Ci6XGb5B.mjs";
import { t as Input } from "./input-B7I4vy8H.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D6Lp5M71.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as useServerFn, n as sendCampaign } from "./crm.functions-CpcA28n0.mjs";
import { t as BASE_PLACEHOLDERS } from "./personalize-BPwaxYCo.mjs";
import { t as Route } from "./campaigns._id-MdvkoFfi.mjs";
import { t as Label } from "./label-BAtza3LO.mjs";
import { t as Textarea } from "./textarea-tHeXRFzh.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-PceKd7UZ.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaigns._id-DiI4QBB2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
function CampaignDetail() {
	const { id } = Route.useParams();
	const qc = useQueryClient();
	const send = useServerFn(sendCampaign);
	const { data: campaign } = useQuery({
		queryKey: ["campaign", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).single();
			if (error) throw error;
			return data;
		}
	});
	const { data: mailboxes = [] } = useQuery({
		queryKey: ["mailboxes"],
		queryFn: async () => {
			const { data, error } = await supabase.from("mailboxes").select("*").order("name");
			if (error) throw error;
			return data;
		}
	});
	const { data: prospects = [] } = useQuery({
		queryKey: ["prospects"],
		queryFn: async () => {
			const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const { data: recipients = [] } = useQuery({
		queryKey: ["recipients", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("campaign_recipients").select("*, prospects(email, first_name, last_name, company)").eq("campaign_id", id);
			if (error) throw error;
			return data;
		},
		refetchInterval: 5e3
	});
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		subject: "",
		body_html: "",
		cc: "",
		bcc: "",
		mailbox_id: "",
		track_opens: true,
		track_clicks: true
	});
	const [attachments, setAttachments] = (0, import_react.useState)([]);
	const [sending, setSending] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!campaign) return;
		setForm({
			name: campaign.name,
			subject: campaign.subject,
			body_html: campaign.body_html,
			cc: (campaign.cc ?? []).join(", "),
			bcc: (campaign.bcc ?? []).join(", "),
			mailbox_id: campaign.mailbox_id ?? "",
			track_opens: campaign.track_opens,
			track_clicks: campaign.track_clicks
		});
		setAttachments(campaign.attachments ?? []);
	}, [campaign]);
	const save = useMutation({
		mutationFn: async (extra) => {
			const list = extra?.attachments ?? attachments;
			const { error } = await supabase.from("campaigns").update({
				name: form.name,
				subject: form.subject,
				body_html: form.body_html,
				cc: form.cc.split(",").map((s) => s.trim()).filter(Boolean),
				bcc: form.bcc.split(",").map((s) => s.trim()).filter(Boolean),
				mailbox_id: form.mailbox_id || null,
				track_opens: form.track_opens,
				track_clicks: form.track_clicks,
				attachments: list
			}).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Saved.");
			qc.invalidateQueries({ queryKey: ["campaign", id] });
		},
		onError: (e) => toast.error(e.message)
	});
	async function uploadFile(file) {
		const path = `${id}/${Date.now()}-${file.name}`;
		const { error } = await supabase.storage.from("attachments").upload(path, file);
		if (error) {
			toast.error(error.message);
			return;
		}
		const next = [...attachments, {
			path,
			name: file.name,
			type: file.type,
			size: file.size
		}];
		setAttachments(next);
		save.mutate({ attachments: next });
	}
	const addRecipients = useMutation({
		mutationFn: async (status) => {
			const pool = status === "all" ? prospects : prospects.filter((p) => p.status === status);
			const existing = new Set(recipients.map((r) => r.prospect_id));
			const rows = pool.filter((p) => !existing.has(p.id)).map((p) => ({
				campaign_id: id,
				prospect_id: p.id
			}));
			if (!rows.length) throw new Error("No new prospects to add.");
			const { error } = await supabase.from("campaign_recipients").insert(rows);
			if (error) throw error;
			return rows.length;
		},
		onSuccess: (count) => {
			toast.success(`${count} recipients added.`);
			qc.invalidateQueries({ queryKey: ["recipients", id] });
		},
		onError: (e) => toast.error(e.message)
	});
	async function handleSend() {
		setSending(true);
		try {
			await save.mutateAsync(void 0);
			const result = await send({ data: { campaignId: id } });
			toast.success(`Sent ${result.sent}, failed ${result.failed}.`);
			qc.invalidateQueries({ queryKey: ["recipients", id] });
			qc.invalidateQueries({ queryKey: ["campaign", id] });
		} catch (error) {
			toast.error(error.message);
		} finally {
			setSending(false);
		}
	}
	const stats = {
		total: recipients.length,
		sent: recipients.filter((r) => r.status === "sent").length,
		failed: recipients.filter((r) => r.status === "failed").length,
		opened: recipients.filter((r) => (r.open_count ?? 0) > 0).length,
		clicked: recipients.filter((r) => (r.click_count ?? 0) > 0).length,
		replied: recipients.filter((r) => r.replied_at).length
	};
	const extraKeys = Array.from(new Set(prospects.flatMap((p) => Object.keys(p.extra ?? {})))).slice(0, 20);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: campaign?.name ?? "Campaign",
		description: "Write once, personalise per prospect, and send.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/campaigns",
					children: "Back"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => save.mutate(void 0),
				children: "Save"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => void handleSend(),
				disabled: sending,
				children: sending ? "Sending…" : "Send campaign"
			})
		] }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "compose",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "compose",
						children: "Compose"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: "recipients",
						children: [
							"Recipients (",
							stats.total,
							")"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "results",
						children: "Results"
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "compose",
					className: "mt-4 grid gap-6 lg:grid-cols-[2fr_1fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4 pt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Campaign name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.name,
									onChange: (e) => setForm({
										...form,
										name: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Subject" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.subject,
									onChange: (e) => setForm({
										...form,
										subject: e.target.value
									}),
									placeholder: "Hi {{first_name}}, a quick idea for {{company}}"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Message (HTML allowed)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 16,
									value: form.body_html,
									onChange: (e) => setForm({
										...form,
										body_html: e.target.value
									}),
									placeholder: "<p>Hi {{first_name}},</p>"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "CC (comma separated)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.cc,
										onChange: (e) => setForm({
											...form,
											cc: e.target.value
										})
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "BCC (comma separated)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.bcc,
										onChange: (e) => setForm({
											...form,
											bcc: e.target.value
										})
									})]
								})]
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-base",
								children: "Sending account"
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.mailbox_id || "__none",
										onValueChange: (v) => setForm({
											...form,
											mailbox_id: v === "__none" ? "" : v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Pick an account" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "__none",
											children: "Not chosen"
										}), mailboxes.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: m.id,
											children: [
												m.name,
												" · ",
												m.from_email
											]
										}, m.id))] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Track opens" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: form.track_opens,
											onCheckedChange: (v) => setForm({
												...form,
												track_opens: v
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Track link clicks" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: form.track_clicks,
											onCheckedChange: (v) => setForm({
												...form,
												track_clicks: v
											})
										})]
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-base",
								children: "Attachments"
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "file",
									onChange: (e) => {
										const file = e.target.files?.[0];
										if (file) uploadFile(file);
									}
								}), attachments.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: a.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => {
											const next = attachments.filter((x) => x.path !== a.path);
											setAttachments(next);
											save.mutate({ attachments: next });
										},
										children: "Remove"
									})]
								}, a.path))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-base",
								children: "Placeholders"
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
								className: "flex flex-wrap gap-2",
								children: [...BASE_PLACEHOLDERS, ...extraKeys].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									children: `{{${key}}}`
								}, key))
							})] })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "recipients",
					className: "mt-4 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "flex flex-wrap gap-2 pt-6",
						children: [
							"all",
							"new",
							"contacted",
							"interested"
						].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => addRecipients.mutate(status),
							children: [
								"Add ",
								status,
								" prospects"
							]
						}, status))
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "overflow-x-auto pt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Prospect" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "text-right" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: recipients.map((r) => {
							const p = r.prospects;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: p?.email }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: r.status === "failed" ? "destructive" : "secondary",
									children: r.status
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: async () => {
											await supabase.from("campaign_recipients").delete().eq("id", r.id);
											qc.invalidateQueries({ queryKey: ["recipients", id] });
										},
										children: "Remove"
									})
								})
							] }, r.id);
						}) })] })
					}) })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "results",
					className: "mt-4 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-3 lg:grid-cols-6",
						children: Object.entries(stats).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "pt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase text-muted-foreground",
								children: key
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl font-semibold",
								children: value
							})]
						}) }, key))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "overflow-x-auto pt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Opens" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Clicks" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Replied" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Problem" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: recipients.map((r) => {
							const p = r.prospects;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: p?.email }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: r.status }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: r.open_count }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: r.click_count }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: r.replied_at ? "Yes" : "—" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "max-w-xs truncate text-destructive",
									children: r.error ?? ""
								})
							] }, r.id);
						}) })] })
					}) })]
				})
			]
		})
	});
}
//#endregion
export { CampaignDetail as component };
