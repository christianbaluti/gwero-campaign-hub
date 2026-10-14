import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { execFileSync } from "node:child_process";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const forbiddenPaths = tracked.filter((path) => {
  const lower = path.toLowerCase();
  if (/^\.env(?:\.|$)/.test(lower) && lower !== ".env.example") return true;
  if (
    /(^|\/)(?:node_modules|dist|\.output|\.deployment|coverage|uploads?|backups?|tmp)(?:\/|$)/.test(
      lower,
    )
  )
    return true;
  if (/\.(?:pem|key|p12|pfx|jks|keystore|dump|bak|zip|tar|tgz|gz)$/i.test(lower)) return true;
  if (extname(lower) === ".sql" && !lower.startsWith("database/")) return true;
  return false;
});

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

const suspiciousFiles = [];
for (const path of tracked) {
  if (forbiddenPaths.includes(path)) continue;
  let contents;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  if (secretPatterns.some((pattern) => pattern.test(contents))) suspiciousFiles.push(path);
}

if (forbiddenPaths.length || suspiciousFiles.length) {
  if (forbiddenPaths.length)
    console.error(`Forbidden tracked artifacts: ${forbiddenPaths.join(", ")}`);
  if (suspiciousFiles.length)
    console.error(`Potential credentials found in: ${suspiciousFiles.join(", ")}`);
  process.exit(1);
}

console.log(`Repository safety check passed for ${tracked.length} tracked files.`);
