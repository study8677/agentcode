import { TASK_LOG_MAX_BYTES } from "./types";

const ANSI_ESCAPE_PATTERN = /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
const SECRET_ASSIGNMENT_PATTERN = /\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*([^\s"']+)/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const COMMON_TOKEN_PATTERN = /\b(?:gh[oprsu]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{16,})\b/g;
const URL_CREDENTIAL_PATTERN = /(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi;
const TRUNCATION_MARKER = "\n[log truncated at 1 MiB]\n";

export type SanitizeTaskLogOptions = {
  maxBytes?: number;
  workspacePaths?: string[];
  secrets?: string[];
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function truncateUtf8(value: string, maxBytes: number): string {
  const encoded = Buffer.from(value, "utf8");

  if (encoded.byteLength <= maxBytes) {
    return value;
  }

  const marker = Buffer.from(TRUNCATION_MARKER, "utf8");
  const contentLimit = Math.max(0, maxBytes - marker.byteLength);
  let truncated = encoded.subarray(0, contentLimit).toString("utf8");

  while (Buffer.byteLength(truncated, "utf8") > contentLimit) {
    truncated = truncated.slice(0, -1);
  }

  return `${truncated}${TRUNCATION_MARKER}`;
}

export function sanitizeTaskLog(input: string, options: SanitizeTaskLogOptions = {}): string {
  const maxBytes = options.maxBytes ?? TASK_LOG_MAX_BYTES;
  let output = input
    .replace(ANSI_ESCAPE_PATTERN, "")
    .replace(SECRET_ASSIGNMENT_PATTERN, "$1=[REDACTED]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(COMMON_TOKEN_PATTERN, "[REDACTED]")
    .replace(URL_CREDENTIAL_PATTERN, "$1[REDACTED]@");

  for (const workspacePath of options.workspacePaths ?? []) {
    if (workspacePath) {
      output = output.replace(new RegExp(escapeRegExp(workspacePath), "g"), "[workspace]");
    }
  }

  for (const secret of options.secrets ?? []) {
    if (secret.length >= 4) {
      output = output.replace(new RegExp(escapeRegExp(secret), "g"), "[REDACTED]");
    }
  }

  return truncateUtf8(output, maxBytes);
}
