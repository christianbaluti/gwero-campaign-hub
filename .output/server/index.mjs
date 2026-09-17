globalThis.__nitro_main__ = import.meta.url;
import { i as serve, r as NodeResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
import { i as toEventHandler, n as defineHandler, o as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-09-17T08:34:47.150Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/agreements-MDeaeKGO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c2c-d3xvADocH7gJIaTJS1M5EMLZyTM\"",
		"mtime": "2026-09-17T08:34:44.506Z",
		"size": 3116,
		"path": "../public/assets/agreements-MDeaeKGO.js"
	},
	"/assets/badge-Bm4QuALw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"303-FbYvx9zHpyU/HHpXadPPnc3FhSM\"",
		"mtime": "2026-09-17T08:34:44.506Z",
		"size": 771,
		"path": "../public/assets/badge-Bm4QuALw.js"
	},
	"/assets/campaigns._id-uLJz9Rvt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"527e-qNVwM/KP/L84DVokk12/LPqrXs8\"",
		"mtime": "2026-09-17T08:34:44.507Z",
		"size": 21118,
		"path": "../public/assets/campaigns._id-uLJz9Rvt.js"
	},
	"/assets/campaigns.index-CwAZbPL1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"949-MnZyWOSheMGgkA52UDu4xwkPvl0\"",
		"mtime": "2026-09-17T08:34:44.507Z",
		"size": 2377,
		"path": "../public/assets/campaigns.index-CwAZbPL1.js"
	},
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-09-17T08:34:47.150Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/card-DErirGBj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fb69-6BtLXyNkrQzGcm4k5UW2lp+ZX68\"",
		"mtime": "2026-09-17T08:34:44.507Z",
		"size": 64361,
		"path": "../public/assets/card-DErirGBj.js"
	},
	"/assets/chevron-down-CBB9vdLn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"75-RJDuyU+wj/OCIONYWOmGH+5rSFo\"",
		"mtime": "2026-09-17T08:34:44.508Z",
		"size": 117,
		"path": "../public/assets/chevron-down-CBB9vdLn.js"
	},
	"/assets/clients-85SizxZ5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f8-xGG8RUuD+lwyVNJn596WPNnC44U\"",
		"mtime": "2026-09-17T08:34:44.508Z",
		"size": 2296,
		"path": "../public/assets/clients-85SizxZ5.js"
	},
	"/assets/clients._id-CKmxsWpQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f36-nICfcRW5HLEk+tk03ox8dRJhYAE\"",
		"mtime": "2026-09-17T08:34:44.508Z",
		"size": 3894,
		"path": "../public/assets/clients._id-CKmxsWpQ.js"
	},
	"/assets/createClientRpc-DaHYbrCU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a38-a7IX0eZuQzMF+4zpj7zXBTjtMOw\"",
		"mtime": "2026-09-17T08:34:44.508Z",
		"size": 35384,
		"path": "../public/assets/createClientRpc-DaHYbrCU.js"
	},
	"/assets/crm.functions-CR37_keJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1462-l+kWgWdvlVSumw+9akRcyVU0Mug\"",
		"mtime": "2026-09-17T08:34:44.509Z",
		"size": 5218,
		"path": "../public/assets/crm.functions-CR37_keJ.js"
	},
	"/assets/deals-BQveMZwN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a7b-HZyQv5hzZZ5KRF+3zWHbtglxQ8E\"",
		"mtime": "2026-09-17T08:34:44.509Z",
		"size": 2683,
		"path": "../public/assets/deals-BQveMZwN.js"
	},
	"/assets/dist-ChGmoMCz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2c0-GCX7awDbYudJdaR90SmHEhGLn+I\"",
		"mtime": "2026-09-17T08:34:44.509Z",
		"size": 704,
		"path": "../public/assets/dist-ChGmoMCz.js"
	},
	"/assets/inbox-BjlBe4n0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"804-YF+Kcd4bKF9ddpgSWxr5hRLaqgg\"",
		"mtime": "2026-09-17T08:34:44.509Z",
		"size": 2052,
		"path": "../public/assets/inbox-BjlBe4n0.js"
	},
	"/assets/index-B7akwMAv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"41117-rRZJE4L7SdE7Sd0yJcII/kx4qT0\"",
		"mtime": "2026-09-17T08:34:44.506Z",
		"size": 266519,
		"path": "../public/assets/index-B7akwMAv.js"
	},
	"/assets/input-C95dInHo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26c-dF3OHSoz0vxl2o2eKBNOBmhiddw\"",
		"mtime": "2026-09-17T08:34:44.510Z",
		"size": 620,
		"path": "../public/assets/input-C95dInHo.js"
	},
	"/assets/jsx-runtime-Cltr0gcK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20ee-ObwGPj96dlkL76iVLbX2wLAXzuw\"",
		"mtime": "2026-09-17T08:34:44.510Z",
		"size": 8430,
		"path": "../public/assets/jsx-runtime-Cltr0gcK.js"
	},
	"/assets/label-n1XASwPx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ac-5wVAnGlZ1uPYO/CSDme8eVbtjMQ\"",
		"mtime": "2026-09-17T08:34:44.511Z",
		"size": 684,
		"path": "../public/assets/label-n1XASwPx.js"
	},
	"/assets/mailboxes-CCF9zUkP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1257-pOoPY6/w5rs/Os7bItG8SJ/ZaY4\"",
		"mtime": "2026-09-17T08:34:44.511Z",
		"size": 4695,
		"path": "../public/assets/mailboxes-CCF9zUkP.js"
	},
	"/assets/prospects-Ck0_qohe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"540f7-e7AEPvwSo9w4GWiWub/Zm4BgAvc\"",
		"mtime": "2026-09-17T08:34:44.511Z",
		"size": 344311,
		"path": "../public/assets/prospects-Ck0_qohe.js"
	},
	"/assets/query-DUqZZgds.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3f325-DGDtiFe48M/XTKzqJlbOxuKkxng\"",
		"mtime": "2026-09-17T08:34:44.512Z",
		"size": 258853,
		"path": "../public/assets/query-DUqZZgds.js"
	},
	"/assets/redirect-Dhm19zUi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f4-ePZWCXP5uehkmkGMkMl5xDch+/Y\"",
		"mtime": "2026-09-17T08:34:44.513Z",
		"size": 500,
		"path": "../public/assets/redirect-Dhm19zUi.js"
	},
	"/assets/routes-SPxY2Jng.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3faf-EfloAPgmWcqvqoH3T8VM1FPQtuc\"",
		"mtime": "2026-09-17T08:34:44.513Z",
		"size": 16303,
		"path": "../public/assets/routes-SPxY2Jng.js"
	},
	"/assets/select-DoqJr3DK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14adc-IT28WfNw5Vwu7VSa8bbxipeNmSo\"",
		"mtime": "2026-09-17T08:34:44.513Z",
		"size": 84700,
		"path": "../public/assets/select-DoqJr3DK.js"
	},
	"/assets/table-Dcmja711.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"66b-e1Dm3O5TFkHS/+VkEy7cdvVJqC0\"",
		"mtime": "2026-09-17T08:34:44.514Z",
		"size": 1643,
		"path": "../public/assets/table-Dcmja711.js"
	},
	"/assets/useMutation-DmhtiGSy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"948-OpE4knMJ9AOIHRUPL/hFDgaamxQ\"",
		"mtime": "2026-09-17T08:34:44.515Z",
		"size": 2376,
		"path": "../public/assets/useMutation-DmhtiGSy.js"
	},
	"/assets/users-D30TDIR4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"92f-fy6sKA9kvrjX8ANcZRQV2vVjM5Y\"",
		"mtime": "2026-09-17T08:34:44.515Z",
		"size": 2351,
		"path": "../public/assets/users-D30TDIR4.js"
	},
	"/assets/x-DvUGDSTy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f-bjLHuhvH4DdfH+rXhCbwwGXhd5I\"",
		"mtime": "2026-09-17T08:34:44.515Z",
		"size": 143,
		"path": "../public/assets/x-DvUGDSTy.js"
	},
	"/assets/styles-BQQzUqbH.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"154c0-U0cDHcr4xqMLGpu/pFODgRSVRvQ\"",
		"mtime": "2026-09-17T08:34:44.516Z",
		"size": 87232,
		"path": "../public/assets/styles-BQQzUqbH.css"
	},
	"/assets/textarea-C47_cuss.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"206-153/9aHCYMOyBp5MW2HSMVmrRvA\"",
		"mtime": "2026-09-17T08:34:44.514Z",
		"size": 518,
		"path": "../public/assets/textarea-C47_cuss.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_tZVDve = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_tZVDve
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
