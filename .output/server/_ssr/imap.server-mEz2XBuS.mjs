import { n as connectTls } from "./socket.server-BosVNerD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/imap.server-mEz2XBuS.js
/** Tiny IMAP reader: fetches recent message headers from INBOX. Server-only. */
var tagCounter = 0;
async function run(socket, command) {
	const tag = `a${++tagCounter}`;
	socket.write(`${tag} ${command}\r\n`);
	const response = await socket.readUntil((acc) => new RegExp(`^${tag} (OK|NO|BAD)`, "m").test(acc), 3e4);
	const status = new RegExp(`^${tag} (OK|NO|BAD)([^\\n]*)`, "m").exec(response);
	if (status && status[1] !== "OK") throw new Error(`Mail server refused ${command.split(" ")[0]}:${status[2] ?? ""}`);
	return response;
}
function headerValue(block, name) {
	const match = new RegExp(`^${name}:\\s*(.*(?:\\r?\\n[ \\t].*)*)`, "im").exec(block);
	return match?.[1] ? match[1].replace(/\r?\n[ \t]+/g, " ").trim() : "";
}
async function imapFetchRecent(config, sinceDays = 14) {
	const socket = await connectTls(config.host, config.port);
	try {
		await socket.readUntil((acc) => /^\* OK/m.test(acc));
		await run(socket, `LOGIN "${config.username.replace(/"/g, "\\\"")}" "${config.password.replace(/"/g, "\\\"")}"`);
		await run(socket, "SELECT INBOX");
		const since = /* @__PURE__ */ new Date(Date.now() - sinceDays * 864e5);
		const searchRes = await run(socket, `UID SEARCH SINCE ${`${since.getUTCDate()}-${[
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		][since.getUTCMonth()]}-${since.getUTCFullYear()}`}`);
		const uids = (/^\* SEARCH([^\r\n]*)/m.exec(searchRes)?.[1] ?? "").trim().split(/\s+/).filter(Boolean).slice(-200);
		if (!uids.length) return [];
		const fetchRes = await run(socket, `UID FETCH ${uids.join(",")} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO)])`);
		const results = [];
		const parts = fetchRes.split(/^\* \d+ FETCH /m).slice(1);
		for (const part of parts) {
			const uid = /UID (\d+)/.exec(part)?.[1] ?? "";
			const block = part.replace(/^[^\n]*\n/, "");
			results.push({
				uid,
				from: headerValue(block, "From"),
				subject: headerValue(block, "Subject"),
				date: headerValue(block, "Date"),
				messageId: headerValue(block, "Message-ID"),
				inReplyTo: headerValue(block, "In-Reply-To")
			});
		}
		await run(socket, "LOGOUT").catch(() => void 0);
		return results;
	} finally {
		socket.end();
	}
}
async function imapVerify(config) {
	const socket = await connectTls(config.host, config.port);
	try {
		await socket.readUntil((acc) => /^\* OK/m.test(acc));
		await run(socket, `LOGIN "${config.username.replace(/"/g, "\\\"")}" "${config.password.replace(/"/g, "\\\"")}"`);
		await run(socket, "LOGOUT").catch(() => void 0);
	} finally {
		socket.end();
	}
}
//#endregion
export { imapFetchRecent, imapVerify };
