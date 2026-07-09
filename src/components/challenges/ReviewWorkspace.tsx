"use client";

import { useEffect, useState } from "react";

import { ReviewFileBrowser } from "@/components/challenges/ReviewFileBrowser";
import { ReviewSubmissionForm } from "@/components/challenges/ReviewSubmissionForm";
import { Badge } from "@/components/ui/Badge";
import type { ReviewChallengeFile, ReviewPrBrief, ReviewReveal } from "@/lib/challenges/review";
import type { ReviewDraft, ReviewFeedback, ReviewLineFinding } from "@/lib/challenges/review-submission";
import type { ChallengeDifficulty, LocalizedText } from "@/lib/types/problem";

type ReviewWorkspaceProps = {
  challengeId: string;
  challengeSlug: string;
  order: number;
  title: LocalizedText;
  summary: LocalizedText;
  difficulty: ChallengeDifficulty;
  language: string;
  sourceProject: string;
  files: ReviewChallengeFile[];
  defaultFileName: string;
  pr: ReviewPrBrief;
  background: string[];
};

const initialDraft: ReviewDraft = {
  mergeDecision: "",
  conclusion: "",
  findings: [],
  tests: ""
};

function createFindingId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `finding-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeStoredDraft(value: unknown): ReviewDraft {
  const saved = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const mergeDecision = saved.mergeDecision === "yes" || saved.mergeDecision === "no" || saved.mergeDecision === "unknown"
    ? saved.mergeDecision
    : "";
  const findings = Array.isArray(saved.findings)
    ? saved.findings
        .filter((finding): finding is ReviewLineFinding => {
          return Boolean(
            finding &&
              typeof finding === "object" &&
              "id" in finding &&
              "fileName" in finding &&
              "lineNumber" in finding
          );
        })
        .map((finding) => ({
          id: String(finding.id),
          fileName: String(finding.fileName),
          lineNumber: Number(finding.lineNumber),
          severity: String(finding.severity || "high"),
          problem: String(finding.problem || ""),
          fix: String(finding.fix || "")
        }))
    : [];

  return {
    mergeDecision,
    conclusion: typeof saved.conclusion === "string" ? saved.conclusion : "",
    findings: findings.filter((finding) => Number.isFinite(finding.lineNumber) && finding.lineNumber > 0),
    tests: typeof saved.tests === "string" ? saved.tests : ""
  };
}

export function ReviewWorkspace({
  challengeId,
  challengeSlug,
  order,
  title,
  summary,
  difficulty,
  language,
  sourceProject,
  files,
  defaultFileName,
  pr,
  background
}: ReviewWorkspaceProps) {
  const initialFileName = files.some((file) => file.name === defaultFileName) ? defaultFileName : files[0]?.name ?? "";
  const [activeFileName, setActiveFileName] = useState(initialFileName);
  const [draft, setDraft] = useState<ReviewDraft>(initialDraft);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [reveal, setReveal] = useState<ReviewReveal | null>(null);
  const displayId = order.toString().padStart(3, "0");
  const storageKey = `agentcode.review.${challengeId}.draft.v2`;
  const legacyStorageKey = `agentcode.review.${challengeId}.draft`;
  const findings = draft.findings;

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(storageKey);

    if (!savedDraft) {
      window.localStorage.removeItem(legacyStorageKey);
      return;
    }

    try {
      const timeout = window.setTimeout(() => {
        setDraft(normalizeStoredDraft(JSON.parse(savedDraft)));
      }, 0);

      return () => window.clearTimeout(timeout);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [legacyStorageKey, storageKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [draft, storageKey]);

  function updateDraft(patch: Partial<ReviewDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSubmitted(false);
    setFeedback(null);
    setReveal(null);
    setSubmitError("");
  }

  function addFinding(finding: Omit<ReviewLineFinding, "id">) {
    const nextFinding = { ...finding, id: createFindingId() };
    setDraft((current) => ({ ...current, findings: [...current.findings, nextFinding] }));
    setSelectedFindingId(nextFinding.id);
    setSubmitted(false);
    setFeedback(null);
    setReveal(null);
  }

  function updateFinding(findingId: string, patch: Partial<ReviewLineFinding>) {
    setDraft((current) => ({
      ...current,
      findings: current.findings.map((finding) => finding.id === findingId ? { ...finding, ...patch } : finding)
    }));
    setSubmitted(false);
    setFeedback(null);
    setReveal(null);
  }

  function deleteFinding(findingId: string) {
    setDraft((current) => ({
      ...current,
      findings: current.findings.filter((finding) => finding.id !== findingId)
    }));
    setSelectedFindingId((current) => current === findingId ? null : current);
  }

  function selectFinding(findingId: string | null) {
    const finding = findings.find((item) => item.id === findingId);

    if (finding) {
      setActiveFileName(finding.fileName);
    }

    setSelectedFindingId(findingId);
  }

  async function submitReview() {
    setSubmitting(true);
    setSubmitError("");
    window.localStorage.setItem(storageKey, JSON.stringify(draft));

    try {
      const response = await fetch(`/api/review/${encodeURIComponent(challengeSlug)}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ draft })
      });

      if (!response.ok) {
        throw new Error("submit failed");
      }

      const result = await response.json() as { feedback: ReviewFeedback; reveal: ReviewReveal };
      setFeedback(result.feedback);
      setReveal(result.reveal);
      setSubmitted(true);
    } catch {
      setSubmitted(false);
      setSubmitError("提交失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="review-workspace-page">
      <div className="review-workspace-header">
        <div>
          <div className="challenge-kicker">
            <span className="id">{displayId}</span>
            <Badge tone="review">Review</Badge>
            <Badge tone={difficulty}>{difficulty}</Badge>
            <span className="pill">{language}</span>
            <span className="source-pill">
              真实来源改编 <strong>{sourceProject}</strong>
            </span>
          </div>
          <h1>{title.zh}</h1>
          <p>{summary.zh}</p>
        </div>
      </div>

      <div className="review-workspace">
        <div className="review-left-pane">
          <ReviewFileBrowser
            activeFileName={activeFileName}
            files={files}
            findings={findings}
            onActiveFileChange={setActiveFileName}
            onAddFinding={addFinding}
            onSelectFinding={selectFinding}
            onUpdateFinding={updateFinding}
            selectedFindingId={selectedFindingId}
          />
        </div>
        <aside className="review-right-pane">
          <ReviewSubmissionForm
            background={background}
            draft={draft}
            feedback={feedback}
            findings={findings}
            onBackToEdit={() => setSubmitted(false)}
            onDeleteFinding={deleteFinding}
            onDraftChange={updateDraft}
            onSelectFinding={selectFinding}
            onSubmit={submitReview}
            onUpdateFinding={updateFinding}
            pr={pr}
            reveal={reveal}
            submitted={submitted}
            submitError={submitError}
            submitting={submitting}
          />
        </aside>
      </div>
    </main>
  );
}
