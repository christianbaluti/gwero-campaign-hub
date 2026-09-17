import net from "node:net";
import tls from "node:tls";
//#region node_modules/.nitro/vite/services/ssr/assets/socket.server-BosVNerD.js
/**
* Minimal line-oriented socket helper used by the SMTP and IMAP clients.
* Server-only.
*/
var LineSocket = class {
	socket;
	buffer = "";
	waiters = [];
	closed = false;
	error = null;
	constructor(socket) {
		this.socket = socket;
		this.socket.setEncoding?.("utf8");
		this.socket.on("data", (chunk) => {
			this.buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");
			this.flush();
		});
		this.socket.on("error", (err) => {
			this.error = err;
			this.closed = true;
			this.flush();
		});
		this.socket.on("close", () => {
			this.closed = true;
			this.flush();
		});
	}
	flush() {
		while (this.waiters.length && (this.buffer.length || this.closed)) {
			const resolve = this.waiters.shift();
			const data = this.buffer;
			this.buffer = "";
			resolve(data);
		}
	}
	readChunk(timeoutMs) {
		if (this.buffer.length) {
			const data = this.buffer;
			this.buffer = "";
			return Promise.resolve(data);
		}
		if (this.error) return Promise.reject(this.error);
		if (this.closed) return Promise.reject(/* @__PURE__ */ new Error("Connection closed by server"));
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Timed out waiting for the mail server")), timeoutMs);
			this.waiters.push((chunk) => {
				clearTimeout(timer);
				if (this.error) reject(this.error);
				else if (!chunk && this.closed) reject(/* @__PURE__ */ new Error("Connection closed by server"));
				else resolve(chunk);
			});
		});
	}
	/** Read until `isDone` accepts the accumulated response. */
	async readUntil(isDone, timeoutMs = 2e4) {
		let acc = "";
		while (true) {
			acc += await this.readChunk(timeoutMs);
			if (isDone(acc)) return acc;
		}
	}
	write(data) {
		this.socket.write(data);
	}
	end() {
		try {
			this.socket.end();
		} catch {}
	}
	get raw() {
		return this.socket;
	}
};
function connectPlain(host, port) {
	return new Promise((resolve, reject) => {
		const socket = net.connect({
			host,
			port
		});
		const timer = setTimeout(() => {
			socket.destroy();
			reject(/* @__PURE__ */ new Error(`Could not reach ${host}:${port}`));
		}, 2e4);
		socket.once("connect", () => {
			clearTimeout(timer);
			resolve(new LineSocket(socket));
		});
		socket.once("error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
function connectTls(host, port) {
	return new Promise((resolve, reject) => {
		const socket = tls.connect({
			host,
			port,
			servername: host
		});
		const timer = setTimeout(() => {
			socket.destroy();
			reject(/* @__PURE__ */ new Error(`Could not reach ${host}:${port}`));
		}, 2e4);
		socket.once("secureConnect", () => {
			clearTimeout(timer);
			resolve(new LineSocket(socket));
		});
		socket.once("error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
function upgradeTls(socket, host) {
	return new Promise((resolve, reject) => {
		const secure = tls.connect({
			socket: socket.raw,
			servername: host
		});
		secure.once("secureConnect", () => resolve(new LineSocket(secure)));
		secure.once("error", reject);
	});
}
//#endregion
export { connectTls as n, upgradeTls as r, connectPlain as t };
