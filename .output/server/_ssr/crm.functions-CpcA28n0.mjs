import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as isRedirect, g as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-DoeSzyyi.mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crm.functions-CpcA28n0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var saveMailboxCredentials = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("d1243d71da78a82bfebe95c8ee14f2799b998b370cbb4b06162c7df2bba55bd6"));
var testMailbox = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("307855ee0dc280ec0ec94fd24a9c973a760b8c14f9156e1833af787c03bceeac"));
var sendCampaign = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("e24b89ad921066215313c042fc9f45b26546872420cc3501a56bf50e5e139668"));
var syncReplies = createServerFn({ method: "POST" }).handler(createSsrRpc("f3acac9464ff036e1b5b43d460c0641978540d4ec45b70b30e4acffb57c25496"));
//#endregion
export { useServerFn as a, testMailbox as i, sendCampaign as n, syncReplies as r, saveMailboxCredentials as t };
