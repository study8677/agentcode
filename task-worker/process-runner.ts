import { spawn } from "node:child_process";

export type CapturedProcessResult = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  output: string;
  durationMs: number;
  timedOut: boolean;
  outputLimitExceeded: boolean;
};

export type CapturedProcessOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  timeoutMs: number;
  maxOutputBytes: number;
  onForcedTermination?: () => void;
};

export function runCapturedProcess(
  command: string,
  args: readonly string[],
  options: CapturedProcessOptions
): Promise<CapturedProcessResult> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const chunks: Buffer[] = [];
    let capturedBytes = 0;
    let timedOut = false;
    let outputLimitExceeded = false;
    let forcedTerminationCalled = false;

    const forceTerminate = () => {
      if (!forcedTerminationCalled) {
        forcedTerminationCalled = true;
        options.onForcedTermination?.();
      }

      child.kill("SIGKILL");
    };

    const capture = (chunk: Buffer) => {
      const previousBytes = capturedBytes;

      if (capturedBytes < options.maxOutputBytes) {
        const remaining = options.maxOutputBytes - capturedBytes;
        chunks.push(chunk.subarray(0, remaining));
        capturedBytes += Math.min(chunk.byteLength, remaining);
      }

      if (previousBytes + chunk.byteLength > options.maxOutputBytes) {
        outputLimitExceeded = true;
        forceTerminate();
      }
    };

    child.stdout.on("data", capture);
    child.stderr.on("data", capture);

    const timeout = setTimeout(() => {
      timedOut = true;
      forceTerminate();
    }, options.timeoutMs);

    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.once("close", (exitCode, signal) => {
      clearTimeout(timeout);
      resolve({
        exitCode,
        signal,
        output: Buffer.concat(chunks).toString("utf8"),
        durationMs: Date.now() - startedAt,
        timedOut,
        outputLimitExceeded
      });
    });

    if (options.input !== undefined) {
      child.stdin.end(options.input);
    } else {
      child.stdin.end();
    }
  });
}
