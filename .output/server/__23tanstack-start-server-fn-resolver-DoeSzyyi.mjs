//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-DoeSzyyi.js
var manifest = {
	"307855ee0dc280ec0ec94fd24a9c973a760b8c14f9156e1833af787c03bceeac": {
		functionName: "testMailbox_createServerFn_handler",
		importer: () => import("./_ssr/crm.functions-Ej-chXEW.mjs")
	},
	"d1243d71da78a82bfebe95c8ee14f2799b998b370cbb4b06162c7df2bba55bd6": {
		functionName: "saveMailboxCredentials_createServerFn_handler",
		importer: () => import("./_ssr/crm.functions-Ej-chXEW.mjs")
	},
	"e24b89ad921066215313c042fc9f45b26546872420cc3501a56bf50e5e139668": {
		functionName: "sendCampaign_createServerFn_handler",
		importer: () => import("./_ssr/crm.functions-Ej-chXEW.mjs")
	},
	"f3acac9464ff036e1b5b43d460c0641978540d4ec45b70b30e4acffb57c25496": {
		functionName: "syncReplies_createServerFn_handler",
		importer: () => import("./_ssr/crm.functions-Ej-chXEW.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
