import { c as HeadContent, d as Outlet, f as lazyRouteComponent, g as useRouter, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Route$15 } from "./campaigns._id-MdvkoFfi.mjs";
import { t as Route$16 } from "./clients._id-_IqAKani.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DDg9_29c.js
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BQQzUqbH.css";
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$14 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Gwero CRM" },
			{
				name: "description",
				content: "Prospect and email campaign management for growing teams."
			},
			{
				name: "author",
				content: "Gwero"
			},
			{
				property: "og:title",
				content: "Gwero CRM"
			},
			{
				property: "og:description",
				content: "Turn prospects into conversations."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "icon",
			href: "/favicon.ico",
			type: "image/x-icon"
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$14.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
var $$splitComponentImporter$7 = () => import("./routes-BKeJbr83.mjs");
var Route$13 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./agreements-B-x2N1Z0.mjs");
var Route$12 = createFileRoute("/agreements")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./clients-C1BZzHuz.mjs");
var Route$11 = createFileRoute("/clients")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./deals-DSffiJ-4.mjs");
var Route$10 = createFileRoute("/deals")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./inbox-B9X6RAOO.mjs");
var Route$9 = createFileRoute("/inbox")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./mailboxes-B4ak_-PO.mjs");
var Route$8 = createFileRoute("/mailboxes")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./prospects-CIZs3JMP.mjs");
var Route$7 = createFileRoute("/prospects")({
	head: () => ({ meta: [
		{ title: "Prospects | Gwero CRM" },
		{
			name: "description",
			content: "Import prospect lists from Excel and track their status."
		},
		{
			property: "og:title",
			content: "Prospects | Gwero CRM"
		},
		{
			property: "og:description",
			content: "Import prospect lists from Excel and track their status."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./campaigns.index-BrovVX0z.mjs");
var Route$6 = createFileRoute("/campaigns/")({
	head: () => ({ meta: [
		{ title: "Campaigns | Gwero CRM" },
		{
			name: "description",
			content: "Draft, send and measure mass email campaigns to your prospects."
		},
		{
			property: "og:title",
			content: "Campaigns | Gwero CRM"
		},
		{
			property: "og:description",
			content: "Draft, send and measure mass email campaigns to your prospects."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var Route$5 = createFileRoute("/api/oauth/google/callback")({ server: { handlers: { GET: async ({ request }) => (await import("./oauth-mail.server-kN3UKU_L.mjs")).finishMailOAuth("google", request) } } });
var Route$4 = createFileRoute("/api/oauth/google/start")({ server: { handlers: { GET: async ({ request }) => (await import("./oauth-mail.server-kN3UKU_L.mjs")).beginMailOAuth("google", request) } } });
var Route$3 = createFileRoute("/api/oauth/microsoft/callback")({ server: { handlers: { GET: async ({ request }) => (await import("./oauth-mail.server-kN3UKU_L.mjs")).finishMailOAuth("microsoft", request) } } });
var Route$2 = createFileRoute("/api/oauth/microsoft/start")({ server: { handlers: { GET: async ({ request }) => (await import("./oauth-mail.server-kN3UKU_L.mjs")).beginMailOAuth("microsoft", request) } } });
var Route$1 = createFileRoute("/api/public/t/click")({ server: { handlers: { GET: async ({ request }) => {
	const params = new URL(request.url).searchParams;
	const recipientId = params.get("r");
	const target = params.get("u");
	let destination = "https://example.com";
	if (target && /^https?:\/\//i.test(target)) destination = target;
	if (recipientId) try {
		const { supabaseAdmin } = await import("./client.server-DZIQA0ow.mjs");
		const { data: row } = await supabaseAdmin.from("campaign_recipients").select("click_count, clicked_at").eq("id", recipientId).maybeSingle();
		if (row) await supabaseAdmin.from("campaign_recipients").update({
			click_count: (row.click_count ?? 0) + 1,
			clicked_at: row.clicked_at ?? (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", recipientId);
	} catch (error) {
		console.error("click tracking failed", error);
	}
	return new Response(null, {
		status: 302,
		headers: { location: destination }
	});
} } } });
var PIXEL = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (c) => c.charCodeAt(0));
var Route = createFileRoute("/api/public/t/open")({ server: { handlers: { GET: async ({ request }) => {
	const recipientId = new URL(request.url).searchParams.get("r");
	if (recipientId) try {
		const { supabaseAdmin } = await import("./client.server-DZIQA0ow.mjs");
		const { data: row } = await supabaseAdmin.from("campaign_recipients").select("open_count, opened_at").eq("id", recipientId).maybeSingle();
		if (row) await supabaseAdmin.from("campaign_recipients").update({
			open_count: (row.open_count ?? 0) + 1,
			opened_at: row.opened_at ?? (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", recipientId);
	} catch (error) {
		console.error("open tracking failed", error);
	}
	return new Response(PIXEL, { headers: {
		"content-type": "image/gif",
		"cache-control": "no-store, no-cache, must-revalidate, private"
	} });
} } } });
var IndexRoute = Route$13.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$14
});
var AgreementsRoute = Route$12.update({
	id: "/agreements",
	path: "/agreements",
	getParentRoute: () => Route$14
});
var ClientsRoute = Route$11.update({
	id: "/clients",
	path: "/clients",
	getParentRoute: () => Route$14
});
var DealsRoute = Route$10.update({
	id: "/deals",
	path: "/deals",
	getParentRoute: () => Route$14
});
var InboxRoute = Route$9.update({
	id: "/inbox",
	path: "/inbox",
	getParentRoute: () => Route$14
});
var MailboxesRoute = Route$8.update({
	id: "/mailboxes",
	path: "/mailboxes",
	getParentRoute: () => Route$14
});
var ProspectsRoute = Route$7.update({
	id: "/prospects",
	path: "/prospects",
	getParentRoute: () => Route$14
});
var CampaignsIndexRoute = Route$6.update({
	id: "/campaigns/",
	path: "/campaigns/",
	getParentRoute: () => Route$14
});
var CampaignsIdRoute = Route$15.update({
	id: "/campaigns/$id",
	path: "/campaigns/$id",
	getParentRoute: () => Route$14
});
var ClientsIdRoute = Route$16.update({
	id: "/$id",
	path: "/$id",
	getParentRoute: () => ClientsRoute
});
var ApiOauthGoogleCallbackRoute = Route$5.update({
	id: "/api/oauth/google/callback",
	path: "/api/oauth/google/callback",
	getParentRoute: () => Route$14
});
var ApiOauthGoogleStartRoute = Route$4.update({
	id: "/api/oauth/google/start",
	path: "/api/oauth/google/start",
	getParentRoute: () => Route$14
});
var ApiOauthMicrosoftCallbackRoute = Route$3.update({
	id: "/api/oauth/microsoft/callback",
	path: "/api/oauth/microsoft/callback",
	getParentRoute: () => Route$14
});
var ApiOauthMicrosoftStartRoute = Route$2.update({
	id: "/api/oauth/microsoft/start",
	path: "/api/oauth/microsoft/start",
	getParentRoute: () => Route$14
});
var ApiPublicTClickRoute = Route$1.update({
	id: "/api/public/t/click",
	path: "/api/public/t/click",
	getParentRoute: () => Route$14
});
var ApiPublicTOpenRoute = Route.update({
	id: "/api/public/t/open",
	path: "/api/public/t/open",
	getParentRoute: () => Route$14
});
var ClientsRouteChildren = { ClientsIdRoute };
var rootRouteChildren = {
	IndexRoute,
	AgreementsRoute,
	ClientsRoute: ClientsRoute._addFileChildren(ClientsRouteChildren),
	DealsRoute,
	InboxRoute,
	MailboxesRoute,
	ProspectsRoute,
	CampaignsIdRoute,
	CampaignsIndexRoute,
	ApiOauthGoogleCallbackRoute,
	ApiOauthGoogleStartRoute,
	ApiOauthMicrosoftCallbackRoute,
	ApiOauthMicrosoftStartRoute,
	ApiPublicTClickRoute,
	ApiPublicTOpenRoute
};
var routeTree = Route$14._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
