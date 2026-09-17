import { n as connectTls, r as upgradeTls, t as connectPlain } from "./socket.server-BosVNerD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/smtp.server-jw_Ubbfl.js
/** Tiny SMTP client (AUTH LOGIN / PLAIN, STARTTLS or implicit TLS). Server-only. */
function b64(value) {
	return Buffer.from(value, "utf8").toString("base64");
}
async function expect(socket, codes, step) {
	const res = await socket.readUntil((acc) => /^\d{3} [^\n]*\r?\n$/m.test(acc.split(/\r?\n/).filter(Boolean).slice(-1)[0] + "\n"));
	const lines = res.trim().split(/\r?\n/);
	const last = lines[lines.length - 1] ?? "";
	const code = Number(last.slice(0, 3));
	if (!codes.includes(code)) throw new Error(`${step} failed: ${last.trim()}`);
	return res;
}
async function cmd(socket, line, codes, step) {
	socket.write(line + "\r\n");
	return expect(socket, codes, step);
}
async function smtpSend(config, mail) {
	let socket = config.secure ? await connectTls(config.host, config.port) : await connectPlain(config.host, config.port);
	try {
		await expect(socket, [220], "Connecting");
		let greeting = await cmd(socket, `EHLO ${(config.username.split("@")[1] || "localhost").trim()}`, [250], "Handshake");
		if (!config.secure && /STARTTLS/i.test(greeting)) {
			await cmd(socket, "STARTTLS", [220], "Starting TLS");
			socket = await upgradeTls(socket, config.host);
			greeting = await cmd(socket, `EHLO ${(config.username.split("@")[1] || "localhost").trim()}`, [250], "Handshake");
		}
		if (config.username) if (/AUTH[^\n]*PLAIN/i.test(greeting)) await cmd(socket, `AUTH PLAIN ${b64(`\u0000${config.username}\u0000${config.password}`)}`, [235], "Sign in");
		else {
			await cmd(socket, "AUTH LOGIN", [334], "Sign in");
			await cmd(socket, b64(config.username), [334], "Sign in");
			await cmd(socket, b64(config.password), [235], "Sign in");
		}
		await cmd(socket, `MAIL FROM:<${mail.envelopeFrom}>`, [250], "Sender");
		const rcpts = [
			mail.to,
			...mail.cc ?? [],
			...mail.bcc ?? []
		].filter(Boolean);
		for (const rcpt of rcpts) await cmd(socket, `RCPT TO:<${rcpt}>`, [250, 251], `Recipient ${rcpt}`);
		await cmd(socket, "DATA", [354], "Sending");
		const body = mail.raw.replace(/\r?\n/g, "\r\n").replace(/\r\n\./g, "\r\n..");
		socket.write(body + "\r\n.\r\n");
		await expect(socket, [250], "Delivery");
		socket.write("QUIT\r\n");
	} finally {
		socket.end();
	}
}
async function smtpVerify(config) {
	let socket = config.secure ? await connectTls(config.host, config.port) : await connectPlain(config.host, config.port);
	try {
		await expect(socket, [220], "Connecting");
		const domain = (config.username.split("@")[1] || "localhost").trim();
		let greeting = await cmd(socket, `EHLO ${domain}`, [250], "Handshake");
		if (!config.secure && /STARTTLS/i.test(greeting)) {
			await cmd(socket, "STARTTLS", [220], "Starting TLS");
			socket = await upgradeTls(socket, config.host);
			greeting = await cmd(socket, `EHLO ${domain}`, [250], "Handshake");
		}
		if (/AUTH[^\n]*PLAIN/i.test(greeting)) await cmd(socket, `AUTH PLAIN ${b64(`\u0000${config.username}\u0000${config.password}`)}`, [235], "Sign in");
		else {
			await cmd(socket, "AUTH LOGIN", [334], "Sign in");
			await cmd(socket, b64(config.username), [334], "Sign in");
			await cmd(socket, b64(config.password), [235], "Sign in");
		}
		socket.write("QUIT\r\n");
	} finally {
		socket.end();
	}
}
//#endregion
export { smtpSend, smtpVerify };
