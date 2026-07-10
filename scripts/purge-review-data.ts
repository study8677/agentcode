import { purgeExpiredReviewData } from "../src/lib/review-data/retention";

async function main() {
  const result = await purgeExpiredReviewData();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`Review retention purge failed: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exitCode = 1;
});
