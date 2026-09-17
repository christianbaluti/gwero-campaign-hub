import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaigns._id-MdvkoFfi.js
var $$splitComponentImporter = () => import("./campaigns._id-DiI4QBB2.mjs");
var Route = createFileRoute("/campaigns/$id")({
	head: () => ({ meta: [
		{ title: "Campaign editor | Gwero CRM" },
		{
			name: "description",
			content: "Write your email, add attachments and recipients, then send."
		},
		{
			property: "og:title",
			content: "Campaign editor | Gwero CRM"
		},
		{
			property: "og:description",
			content: "Write your email, add attachments and recipients, then send."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
