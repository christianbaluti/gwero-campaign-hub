/** Tiny IMAP reader: fetches recent message headers from INBOX. Server-only. */
import { connectTls, type LineSocket } from "./socket.server";

export interface ImapConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface ImapHeader {
  uid: string;
  from: string;
  subject: string;
  date: string;
  messageId: string;
  inReplyTo: string;
}

let tagCounter = 0;

async function run(socket: LineSocket, command: string) {
  const tag = `a${++tagCounter}`;
  socket.write(`${tag} ${command}\r\n`);
  const response = await socket.readUntil((acc) =>
    new RegExp(`^${tag} (OK|NO|BAD)`, "m").test(acc),
  , 30000);
  const status = new RegExp(`^${tag} (OK|NO|BAD)([^\\n]*)`, "m").exec(response);
  if (status && status[1] !== "OK") {
    throw new Error(`Mail server refused ${command.split(" ")[0]}:${status[2] ?? ""}`);
  }
  return response;
}

function headerValue(block: string, name: string) {
  const match = new RegExp(`^${name}:\\s*(.*(?:\\r?\\n[ \\t].*)*)`, "im").exec(block);
  return match ? match[1].replace(/\r?\n[ \t]+/g, " ").trim() : "";
}

export async function imapFetchRecent(config: ImapConfig, sinceDays = 14): Promise<ImapHeader[]> {
  const socket = await connectTls(config.host, config.port);
  try {
    await socket.readUntil((acc) => /^\* OK/m.test(acc));
    await run(socket, `LOGIN "${config.username.replace(/"/g, '\\"')}" "${config.password.replace(/"/g, '\\"')}"`);
    await run(socket, "SELECT INBOX");

    const since = new Date(Date.now() - sinceDays * 86400000);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sinceStr = `${since.getUTCDate()}-${months[since.getUTCMonth()]}-${since.getUTCFullYear()}`;
    const searchRes = await run(socket, `UID SEARCH SINCE ${sinceStr}`);
    const uids = (/^\* SEARCH([^\r\n]*)/m.exec(searchRes)?.[1] ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(-200);
    if (!uids.length) return [];

    const fetchRes = await run(
      socket,
      `UID FETCH ${uids.join(",")} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO)])`,
    );

    const results: ImapHeader[] = [];
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
        inReplyTo: headerValue(block, "In-Reply-To"),
      });
    }
    await run(socket, "LOGOUT").catch(() => undefined);
    return results;
  } finally {
    socket.end();
  }
}

export async function imapVerify(config: ImapConfig): Promise<void> {
  const socket = await connectTls(config.host, config.port);
  try {
    await socket.readUntil((acc) => /^\* OK/m.test(acc));
    await run(socket, `LOGIN "${config.username.replace(/"/g, '\\"')}" "${config.password.replace(/"/g, '\\"')}"`);
    await run(socket, "LOGOUT").catch(() => undefined);
  } finally {
    socket.end();
  }
}
