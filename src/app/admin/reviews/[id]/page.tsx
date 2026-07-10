import Link from "next/link";

import {
  authenticateReviewer,
  getReviewAttemptForAdmin,
} from "@/lib/review-data";

import { AdjudicationForm } from "./AdjudicationForm";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function rubricItems(snapshot: unknown) {
  const root = record(snapshot);
  const reveal = record(root?.reveal) ?? root;
  const candidates = Array.isArray(reveal?.requiredFindings)
    ? reveal.requiredFindings
    : Array.isArray(reveal?.rubricItems)
      ? reveal.rubricItems.filter((item) => record(item)?.required !== false)
      : [];

  return candidates.map((candidate, index) => {
    const item = record(candidate);
    return {
      id: typeof item?.id === "string" ? item.id : `required-${index + 1}`,
      label: typeof item?.summary === "string" ? item.summary : typeof item?.id === "string" ? item.id : `Required ${index + 1}`
    };
  });
}

function falsePositiveRules(snapshot: unknown) {
  const root = record(snapshot);
  const reveal = record(root?.reveal) ?? root;
  const candidates = Array.isArray(reveal?.disallowedConclusions)
    ? reveal.disallowedConclusions
    : Array.isArray(reveal?.falsePositiveRules)
      ? reveal.falsePositiveRules
      : [];

  return candidates.map((candidate, index) => {
    const item = record(candidate);
    return {
      id: typeof item?.id === "string" ? item.id : `disallowed-${index + 1}`,
      label: typeof candidate === "string" ? candidate : typeof item?.summary === "string" ? item.summary : `Disallowed ${index + 1}`
    };
  });
}

export default async function ReviewAttemptAdminPage({ params }: PageProps) {
  const { id } = await params;
  const loaded = await loadAttempt(id);

  if (loaded.error || !loaded.attempt) {
    return <Message text={loaded.error ?? "无法加载提交。"} />;
  }

  const { attempt, items } = loaded;
  return (
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", fontFamily: "ui-sans-serif, system-ui", color: "#182230" }}>
        <Link href="/admin/reviews" style={{ color: "#175cd3", textDecoration: "none" }}>← 返回队列</Link>
        <h1 style={{ marginBottom: 8 }}>{attempt.challengeSlug} · #{attempt.attemptNumber}</h1>
        <p style={{ color: "#667085" }}>截止 {attempt.adjudicationDeadline.toLocaleString("zh-CN")} · {attempt.status.toLowerCase()}</p>

        <section style={panelStyle}>
          <h2>用户提交</h2>
          <pre style={preStyle}>{JSON.stringify(attempt.rawDraft, null, 2)}</pre>
        </section>
        <section style={panelStyle}>
          <h2>自动预评估</h2>
          <pre style={preStyle}>{JSON.stringify(attempt.provisionalFeedback, null, 2)}</pre>
        </section>
        <section style={panelStyle}>
          <h2>答案快照</h2>
          <pre style={preStyle}>{JSON.stringify(attempt.answerSnapshot, null, 2)}</pre>
        </section>
        <section style={panelStyle}>
          <h2>人工终审</h2>
          {attempt.adjudication ? <pre style={preStyle}>{JSON.stringify(attempt.adjudication, null, 2)}</pre> : items.length > 0
            ? <AdjudicationForm attemptId={attempt.id} rubricItems={items} falsePositiveRules={falsePositiveRules(attempt.answerSnapshot)} />
            : <p style={{ color: "#b42318" }}>答案快照中没有可终审的 required rubric item。</p>}
        </section>
      </main>
  );
}

async function loadAttempt(id: string) {
  try {
    await authenticateReviewer();
    const attempt = await getReviewAttemptForAdmin(id);
    return { attempt, items: rubricItems(attempt.answerSnapshot), error: null };
  } catch (error) {
    return { attempt: null, items: [], error: error instanceof Error ? error.message : "无法加载提交。" };
  }
}

function Message({ text }: { text: string }) {
  return <main style={{ maxWidth: 760, margin: "60px auto", padding: 24, fontFamily: "ui-sans-serif, system-ui" }}><h1>终审后台</h1><p>{text}</p></main>;
}

const panelStyle = { border: "1px solid #e4e7ec", borderRadius: 12, padding: 20, marginTop: 20, background: "white" };
const preStyle = { padding: 16, borderRadius: 8, background: "#f8fafc", whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const, fontSize: 13 };
