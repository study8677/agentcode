"use client";

import { useEffect, useMemo, useState } from "react";

import type { ReviewExpectedFinding, ReviewReveal, ReviewScoringHints } from "@/lib/challenges/review";

type MergeDecision = "yes" | "no" | "unknown" | "";

type ReviewDraft = {
  mergeDecision: MergeDecision;
  severity: string;
  conclusion: string;
  problem: string;
  impact: string;
  fix: string;
  tests: string;
  confidence: string;
};

type MatchedFinding = {
  finding: ReviewExpectedFinding;
  matched: boolean;
};

type Feedback = {
  score: number;
  checks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
  requiredMatches: MatchedFinding[];
  optionalMatches: MatchedFinding[];
};

const initialDraft: ReviewDraft = {
  mergeDecision: "",
  severity: "high",
  conclusion: "",
  problem: "",
  impact: "",
  fix: "",
  tests: "",
  confidence: "medium"
};

const template = `是否可以合并：可以 / 不可以 / 需要更多信息

总体结论：

Finding：
- 严重程度：
- 问题描述：
- 影响说明：
- 修复建议：

测试评价：

置信度：高 / 中 / 低`;

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function matchFinding(body: string, finding: ReviewExpectedFinding): boolean {
  if (!finding.matchTerms || finding.matchTerms.length === 0) {
    return false;
  }

  return finding.matchTerms.some((group) => group.every((term) => body.includes(term.toLowerCase())));
}

function scoreDraft(draft: ReviewDraft, scoringHints: ReviewScoringHints, reveal: ReviewReveal): Feedback {
  const body = `${draft.conclusion}\n${draft.problem}\n${draft.impact}\n${draft.fix}\n${draft.tests}`.toLowerCase();

  const requiredMatches = reveal.requiredFindings.map((finding) => ({
    finding,
    matched: matchFinding(body, finding)
  }));
  const optionalMatches = reveal.optionalFindings.map((finding) => ({
    finding,
    matched: matchFinding(body, finding)
  }));
  const matchedRequired = requiredMatches.filter((item) => item.matched).length;
  const totalRequired = requiredMatches.length;

  const mergePassed = reveal.canMerge ? draft.mergeDecision === "yes" : draft.mergeDecision === "no";
  const hasMatchTerms = reveal.requiredFindings.some((finding) => finding.matchTerms && finding.matchTerms.length > 0);
  const regressionPassed = hasMatchTerms
    ? matchedRequired > 0
    : includesAny(body, scoringHints.coreRiskTerms.map((term) => term.toLowerCase())) &&
      includesAny(body, ["回归", "风险", "破坏", "泄漏", "绕过", "跳过", "允许", "正确", "regression", "risk", "leak", "bypass", "correct"]);
  const semanticPassed =
    includesAny(body, scoringHints.boundaryTerms.map((term) => term.toLowerCase())) &&
    includesAny(body, ["边界", "语义", "明确", "确定", "不确定", "约束", "unknown", "contract", "boundary", "semantics"]);
  const testPassed =
    includesAny(body, ["测试", "test"]) &&
    includesAny(body, scoringHints.testTerms.map((term) => term.toLowerCase()));
  const fixPassed =
    includesAny(body, scoringHints.fixTerms.map((term) => term.toLowerCase())) ||
    (includesAny(body, ["保留", "继续执行", "不能跳过", "不要", "不能", "无需修改"]) &&
      includesAny(body, scoringHints.coreRiskTerms.map((term) => term.toLowerCase())));

  const checks = [
    {
      label: "合并判断",
      passed: mergePassed,
      detail: mergePassed
        ? "你的 merge 结论和参考答案一致。"
        : draft.mergeDecision === "unknown"
          ? "参考答案有明确结论。“需要更多信息”只有在你说清缺什么信息、且主要风险点已确认时才是好答案。"
          : "你的 merge 结论和参考答案不一致，对照下方解析看看漏掉或误判了什么。"
    },
    {
      label: "核心判断点",
      passed: regressionPassed,
      detail: hasMatchTerms
        ? `你命中了 ${matchedRequired}/${totalRequired} 个必须 finding，逐条对照见下方解析。`
        : regressionPassed
          ? "你的分析覆盖了这道题的核心判断点。"
          : "待补：你的分析可能没有落到这道题真正的判断点上，对照解析确认。"
    },
    {
      label: "语义边界",
      passed: semanticPassed,
      detail: semanticPassed
        ? "你说明了原有行为契约和补丁涉及的边界。"
        : "待补：需要解释补丁是否改变了输入、权限、状态或数据语义。"
    },
    {
      label: "测试覆盖",
      passed: testPassed,
      detail: testPassed
        ? "你对测试覆盖给出了具体评价。"
        : "待补：需要评价现有测试是否覆盖了关键场景，最好给出具体输入。"
    },
    {
      label: "修复建议",
      passed: fixPassed,
      detail: fixPassed
        ? "你的建议能落到具体代码、配置或测试边界。"
        : "待补：建议需要可执行，说明改哪里、怎么改，而不是只说方向。"
    }
  ];

  const findingScore = totalRequired > 0 ? Math.round(30 * (matchedRequired / totalRequired)) : (regressionPassed ? 30 : 0);
  const mergeScore = mergePassed ? 30 : draft.mergeDecision === "unknown" && matchedRequired > 0 ? 10 : 0;
  const score =
    mergeScore +
    (hasMatchTerms ? findingScore : checks[1].passed ? 30 : 0) +
    (semanticPassed ? 15 : 0) +
    (testPassed ? 10 : 0) +
    (fixPassed ? 15 : 0);

  return { score, checks, requiredMatches, optionalMatches };
}

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
  challengeId: string;
  scoringHints: ReviewScoringHints;
  reveal: ReviewReveal;
};

export function ReviewSubmissionForm({ challengeId, scoringHints, reveal }: ReviewSubmissionFormProps) {
  const [draft, setDraft] = useState<ReviewDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = `agentcode.review.${challengeId}.draft`;
  const feedback = useMemo(() => scoreDraft(draft, scoringHints, reveal), [draft, scoringHints, reveal]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const savedDraft = window.localStorage.getItem(storageKey);
      if (!savedDraft) {
        return;
      }

      try {
        setDraft({ ...initialDraft, ...JSON.parse(savedDraft) });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [storageKey]);

  function updateDraft(field: keyof ReviewDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSubmitted(false);
    setSaved(false);
  }

  function saveDraft() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setSaved(true);
  }

  async function copyTemplate() {
    if (!navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function resetDraft() {
    setDraft(initialDraft);
    setSubmitted(false);
    setSaved(false);
    window.localStorage.removeItem(storageKey);
  }

  function submitReview() {
    setSubmitted(true);
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }

  const canSubmit =
    Boolean(draft.mergeDecision) &&
    draft.conclusion.trim().length >= 10 &&
    draft.problem.trim().length >= 20 &&
    draft.impact.trim().length >= 10;

  return (
    <section className="challenge-section card" id="submit">
      <div className="card-head">
        <h2>提交你的审核</h2>
        <span className="mono">提交后展示参考解析</span>
      </div>

      <form
        className="review-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitReview();
        }}
      >
        <fieldset className="form-block">
          <legend>1. 这个 PR 能不能合并？</legend>
          <label className="choice-row">
            <input
              checked={draft.mergeDecision === "yes"}
              name="mergeDecision"
              onChange={() => updateDraft("mergeDecision", "yes")}
              type="radio"
            />
            <span>Approve：可以合并</span>
          </label>
          <label className="choice-row">
            <input
              checked={draft.mergeDecision === "no"}
              name="mergeDecision"
              onChange={() => updateDraft("mergeDecision", "no")}
              type="radio"
            />
            <span>Request changes：发现必须修复的问题</span>
          </label>
          <label className="choice-row">
            <input
              checked={draft.mergeDecision === "unknown"}
              name="mergeDecision"
              onChange={() => updateDraft("mergeDecision", "unknown")}
              type="radio"
            />
            <span>需要更多信息</span>
          </label>
        </fieldset>

        <label className="form-field">
          <span>总体结论</span>
          <textarea
            onChange={(event) => updateDraft("conclusion", event.target.value)}
            placeholder="用 1-3 句话写出你的结论和主要理由。"
            rows={3}
            value={draft.conclusion}
          />
        </label>

        <label className="form-field">
          <span>严重程度</span>
          <select value={draft.severity} onChange={(event) => updateDraft("severity", event.target.value)}>
            <option value="blocking">阻塞合并 - 不能进主分支</option>
            <option value="high">高风险 - 会引入错误行为或回归</option>
            <option value="medium">中风险 - 边界缺失或测试不足</option>
            <option value="low">低风险 - 可维护性或表达问题</option>
            <option value="none">无阻塞问题 - 可以合并</option>
          </select>
        </label>

        <label className="form-field">
          <span>Finding：你看到的核心问题（或你确认过的风险点）</span>
          <textarea
            onChange={(event) => updateDraft("problem", event.target.value)}
            placeholder="描述你在 diff 中看到的主要风险，写清楚它影响哪类输入。如果你认为可以合并，写出你逐一确认过哪些风险点、为什么它们不成立。"
            rows={4}
            value={draft.problem}
          />
        </label>

        <label className="form-field">
          <span>为什么这很重要？</span>
          <textarea
            onChange={(event) => updateDraft("impact", event.target.value)}
            placeholder="说明这个判断会影响哪些输入、是否会破坏原有约束、为什么支持你的 merge 结论。"
            rows={3}
            value={draft.impact}
          />
        </label>

        <label className="form-field">
          <span>建议怎么修？</span>
          <textarea
            onChange={(event) => updateDraft("fix", event.target.value)}
            placeholder="写出可执行的修复方向，而不是只说“改一下”。认为可以合并则写“无需修改”并说明理由。"
            rows={3}
            value={draft.fix}
          />
        </label>

        <label className="form-field">
          <span>测试评价：应该补什么测试？</span>
          <textarea
            onChange={(event) => updateDraft("tests", event.target.value)}
            placeholder="写出至少一个能验证你结论的测试输入。"
            rows={3}
            value={draft.tests}
          />
        </label>

        <label className="form-field compact-field">
          <span>置信度</span>
          <select value={draft.confidence} onChange={(event) => updateDraft("confidence", event.target.value)}>
            <option value="high">高 - 我能明确给出结论和证据</option>
            <option value="medium">中 - 我能判断风险，但细节还需要确认</option>
            <option value="low">低 - 我需要更多上下文</option>
          </select>
        </label>

        <div className="form-actions">
          <button className="button button-primary" disabled={!canSubmit} type="submit">
            提交 Review
          </button>
          <button className="button button-outline" onClick={saveDraft} type="button">
            保存草稿
          </button>
          <button className="button button-outline" onClick={copyTemplate} type="button">
            {copied ? "已复制" : "复制 Review 模板"}
          </button>
          <button className="button button-ghost" onClick={resetDraft} type="button">
            清空重写
          </button>
          {saved ? <span className="form-note">草稿已保存在当前浏览器。</span> : null}
        </div>
      </form>

      {submitted ? (
        <div className="feedback-panel">
          <div>
            <span className="mono">Review 质量</span>
            <strong>{feedback.score}/100</strong>
          </div>
          <p>这是前端本地规则的即时反馈，用来检查你的 review 是否覆盖关键风险。后续会接入账号、数据库和更完整的评分记录。</p>
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
        </div>
      ) : null}
    </section>
  );
}
