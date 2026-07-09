"use client";

import type { CSSProperties } from "react";

import type { ReviewPrBrief, ReviewReveal } from "@/lib/challenges/review";
import type { MatchedFinding, MergeDecision, ReviewDraft, ReviewFeedback, ReviewLineFinding } from "@/lib/challenges/review-submission";

function FindingCard({ item, kind }: { item: MatchedFinding; kind: "required" | "optional" }) {
  const { finding, matched } = item;
  const hasTerms = Boolean(finding.matchTerms && finding.matchTerms.length > 0);

  return (
    <div className={matched ? "feedback-check passed" : "feedback-check"}>
      <span>{hasTerms ? (matched ? "命中" : kind === "required" ? "漏报" : "未提及") : finding.severity}</span>
      <div>
        <strong>
          [{finding.severity}] {finding.summary}
        </strong>
        {finding.expectedReasoning ? <p>{finding.expectedReasoning}</p> : null}
        {finding.acceptableFix ? <p>修复方向：{finding.acceptableFix}</p> : null}
      </div>
    </div>
  );
}

type ReviewSubmissionFormProps = {
  pr: ReviewPrBrief;
  background: string[];
  draft: ReviewDraft;
  findings: ReviewLineFinding[];
  submitted: boolean;
  submitting: boolean;
  submitError: string;
  feedback: ReviewFeedback | null;
  reveal: ReviewReveal | null;
  onDraftChange: (patch: Partial<ReviewDraft>) => void;
  onUpdateFinding: (findingId: string, patch: Partial<ReviewLineFinding>) => void;
  onDeleteFinding: (findingId: string) => void;
  onSelectFinding: (findingId: string) => void;
  onSubmit: () => void;
  onBackToEdit: () => void;
};

const mergeOptions: Array<{ label: string; value: Exclude<MergeDecision, ""> }> = [
  { label: "Approve", value: "yes" },
  { label: "Request changes", value: "no" },
  { label: "需要更多信息", value: "unknown" }
];

export function ReviewSubmissionForm({
  pr,
  background,
  draft,
  findings,
  submitted,
  submitting,
  submitError,
  feedback,
  reveal,
  onDraftChange,
  onUpdateFinding,
  onDeleteFinding,
  onSelectFinding,
  onSubmit,
  onBackToEdit
}: ReviewSubmissionFormProps) {
  const canSubmit = Boolean(draft.mergeDecision) && draft.conclusion.trim().length >= 10;

  if (submitted && feedback && reveal) {
    return (
      <section className="review-panel" id="submit">
        <div className="review-panel-head" style={{ "--score": feedback.score } as CSSProperties}>
          <div>
            <span className="mono">Review 质量</span>
            <strong>{feedback.score}/100</strong>
          </div>
          <button className="button button-outline" onClick={onBackToEdit} type="button">
            返回编辑
          </button>
        </div>

        <div className="feedback-checks">
          {feedback.checks.map((check) => (
            <div className={check.passed ? "feedback-check passed" : "feedback-check"} key={check.label}>
              <span>{check.passed ? "命中" : "待补"}</span>
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <details className="reference-disclosure" open>
          <summary>参考解析</summary>
          <div className="section-body">
            <p>
              <strong>参考结论：{reveal.canMerge ? "可以合并" : "不能直接合并（request changes）"}</strong>
              {reveal.mergeRationale ? ` — ${reveal.mergeRationale}` : ""}
            </p>

            {feedback.requiredMatches.length > 0 ? (
              <>
                <p>
                  <strong>{reveal.canMerge ? "approve 前必须确认的点：" : "必须命中的 finding："}</strong>
                </p>
                <div className="feedback-checks">
                  {feedback.requiredMatches.map((item) => (
                    <FindingCard item={item} key={item.finding.id} kind="required" />
                  ))}
                </div>
              </>
            ) : null}

            {feedback.optionalMatches.length > 0 ? (
              <>
                <p>
                  <strong>加分 finding：</strong>
                </p>
                <div className="feedback-checks">
                  {feedback.optionalMatches.map((item) => (
                    <FindingCard item={item} key={item.finding.id} kind="optional" />
                  ))}
                </div>
              </>
            ) : null}

            {reveal.analysisNotes.length > 0 ? (
              <>
                <p>
                  <strong>解析：</strong>
                </p>
                {reveal.analysisNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </>
            ) : null}

            {reveal.behaviorChecks.length > 0 ? (
              <div className="behavior-table-wrap">
                <table className="behavior-table">
                  <thead>
                    <tr>
                      <th>输入 / 场景</th>
                      <th>原有约束</th>
                      <th>审查时应验证</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reveal.behaviorChecks.map((item) => (
                      <tr key={`${item.input}-${item.reviewQuestion}`}>
                        <td>{item.input}</td>
                        <td>{item.expected}</td>
                        <td>{item.reviewQuestion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <p>
              <strong>这道题练的是：</strong>
              {reveal.learningGoal}
            </p>

            <div className="reference-links">
              <span className="mono">上游来源</span>
              {reveal.references.map((reference) => (
                <a href={reference.url} key={reference.url} rel="noreferrer" target="_blank">
                  {reference.label}
                </a>
              ))}
            </div>
          </div>
        </details>
      </section>
    );
  }

  return (
    <section className="review-panel" id="submit">
      <details className="review-context-group" open>
        <summary>
          <span>PR 说明</span>
          <small>{pr.author} · CI passed</small>
        </summary>
        <div className="section-body compact">
          <p>
            <strong>{pr.title}</strong>
          </p>
          {pr.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </details>

      {background.length > 0 ? (
        <details className="review-context-group">
          <summary>
            <span>背景</span>
            <small>{background.length} 条</small>
          </summary>
          <div className="section-body compact">
            {background.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </details>
      ) : null}

      <form
        className="review-form compact-review-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <fieldset className="segmented-field">
          <legend>合并判断</legend>
          <div className="segmented-control">
            {mergeOptions.map((option) => (
              <button
                className={draft.mergeDecision === option.value ? "active" : ""}
                key={option.value}
                onClick={() => onDraftChange({ mergeDecision: option.value })}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="form-field">
          <span>总体结论</span>
          <textarea
            onChange={(event) => onDraftChange({ conclusion: event.target.value })}
            placeholder="用 1-3 句话写出你的结论和主要理由。"
            rows={4}
            value={draft.conclusion}
          />
        </label>

        <div className="finding-list-panel">
          <div className="finding-list-head">
            <strong>Findings</strong>
            <span className="mono">{findings.length}</span>
          </div>
          {findings.length > 0 ? (
            <div className="finding-list">
              {findings.map((finding) => (
                <article className="finding-item" key={finding.id}>
                  <button className="finding-anchor" onClick={() => onSelectFinding(finding.id)} type="button">
                    {finding.fileName}:{finding.lineNumber}
                  </button>
                  <select
                    aria-label="严重程度"
                    onChange={(event) => onUpdateFinding(finding.id, { severity: event.target.value })}
                    value={finding.severity}
                  >
                    <option value="blocking">blocking</option>
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                    <option value="check">check</option>
                  </select>
                  <textarea
                    aria-label="问题描述"
                    onChange={(event) => onUpdateFinding(finding.id, { problem: event.target.value })}
                    placeholder="问题描述"
                    rows={3}
                    value={finding.problem}
                  />
                  <textarea
                    aria-label="修复建议"
                    onChange={(event) => onUpdateFinding(finding.id, { fix: event.target.value })}
                    placeholder="修复建议"
                    rows={2}
                    value={finding.fix}
                  />
                  <button className="button button-ghost" onClick={() => onDeleteFinding(finding.id)} type="button">
                    删除
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-findings">点击左侧代码行号添加 finding。</p>
          )}
        </div>

        <label className="form-field">
          <span>测试评价（可选）</span>
          <textarea
            onChange={(event) => onDraftChange({ tests: event.target.value })}
            placeholder="现有测试证明了什么？还缺什么？"
            rows={3}
            value={draft.tests}
          />
        </label>

        <div className="form-actions">
          <button className="button button-primary" disabled={!canSubmit || submitting} type="submit">
            {submitting ? "提交中..." : "提交 Review"}
          </button>
          <span className="form-note">草稿自动保存</span>
          {submitError ? <span className="form-note error">{submitError}</span> : null}
        </div>
      </form>
    </section>
  );
}
