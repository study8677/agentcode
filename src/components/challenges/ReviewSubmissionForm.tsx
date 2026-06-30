"use client";

import { useEffect, useMemo, useState } from "react";

import type { ReviewScoringHints, ReviewSourceLink } from "@/lib/challenges/review";

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

type Feedback = {
  score: number;
  checks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
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

Blocking finding：
- 严重程度：高
- 问题描述：
- 影响说明：
- 修复建议：

测试评价：

置信度：高 / 中 / 低`;

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function scoreDraft(draft: ReviewDraft, scoringHints: ReviewScoringHints): Feedback {
  const body = `${draft.conclusion}\n${draft.problem}\n${draft.impact}\n${draft.fix}\n${draft.tests}`.toLowerCase();
  const mergePassed = draft.mergeDecision === "no";
  const regressionPassed =
    includesAny(body, scoringHints.coreRiskTerms.map((term) => term.toLowerCase())) &&
    includesAny(body, ["回归", "风险", "破坏", "泄漏", "绕过", "跳过", "允许", "regression", "risk", "leak", "bypass"]);
  const semanticPassed =
    includesAny(body, scoringHints.boundaryTerms.map((term) => term.toLowerCase())) &&
    includesAny(body, ["边界", "语义", "明确", "确定", "不确定", "unknown", "contract", "boundary", "semantics"]);
  const testPassed =
    includesAny(body, ["测试", "test"]) &&
    includesAny(body, scoringHints.testTerms.map((term) => term.toLowerCase()));
  const fixPassed =
    includesAny(body, scoringHints.fixTerms.map((term) => term.toLowerCase())) ||
    (includesAny(body, ["保留", "继续执行", "不能跳过", "不要", "不能"]) &&
      includesAny(body, scoringHints.coreRiskTerms.map((term) => term.toLowerCase())));

  const checks = [
    {
      label: "合并判断",
      passed: mergePassed,
      detail: mergePassed ? "你给出了 request changes 结论。" : "需要把结论写清楚：是否存在阻塞合并的问题。"
    },
    {
      label: "核心风险",
      passed: regressionPassed,
      detail: regressionPassed
        ? "你指出了 AI patch 可能破坏原有约束或安全边界。"
        : "待补：需要说明是否存在未覆盖的反例、回归或安全风险。"
    },
    {
      label: "语义边界",
      passed: semanticPassed,
      detail: semanticPassed
        ? "你说明了原有行为契约和补丁改变的边界。"
        : "待补：需要解释补丁是否改变了输入、权限、状态或数据语义。"
    },
    {
      label: "测试覆盖",
      passed: testPassed,
      detail: testPassed
        ? "你提到了需要补充反向或边界测试。"
        : "待补：需要评价新增测试是否只覆盖了正向场景。"
    },
    {
      label: "修复建议",
      passed: fixPassed,
      detail: fixPassed
        ? "你的修复方向能落到具体代码、配置或测试边界。"
        : "待补：修复建议需要说明如何更精确地判断边界，而不是只放宽条件。"
    }
  ];

  const score = checks.reduce((total, check, index) => {
    const weights = [30, 30, 15, 10, 15];
    return total + (check.passed ? weights[index] : 0);
  }, 0);

  return { score, checks };
}

type ReviewSubmissionFormProps = {
  challengeId: string;
  referenceLinks: ReviewSourceLink[];
  scoringHints: ReviewScoringHints;
};

export function ReviewSubmissionForm({ challengeId, referenceLinks, scoringHints }: ReviewSubmissionFormProps) {
  const [draft, setDraft] = useState<ReviewDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = `agentcode.review.${challengeId}.draft`;
  const feedback = useMemo(() => scoreDraft(draft, scoringHints), [draft, scoringHints]);

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
        <span className="mono">本地 Review 反馈</span>
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
              checked={draft.mergeDecision === "no"}
              name="mergeDecision"
              onChange={() => updateDraft("mergeDecision", "no")}
              type="radio"
            />
            <span>Request changes：发现必须修复的问题</span>
          </label>
          <label className="choice-row">
            <input
              checked={draft.mergeDecision === "yes"}
              name="mergeDecision"
              onChange={() => updateDraft("mergeDecision", "yes")}
              type="radio"
            />
            <span>可以合并</span>
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
            placeholder="用 1-3 句话写出你的结论，例如是否 request changes，以及主要理由。"
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
          </select>
        </label>

        <label className="form-field">
          <span>Blocking finding：核心问题是什么？</span>
          <textarea
            onChange={(event) => updateDraft("problem", event.target.value)}
            placeholder="描述你在 diff 中看到的主要风险。尽量写清楚它影响哪类输入。"
            rows={4}
            value={draft.problem}
          />
        </label>

        <label className="form-field">
          <span>为什么这很重要？</span>
          <textarea
            onChange={(event) => updateDraft("impact", event.target.value)}
            placeholder="说明这个问题会影响哪些输入、是否会破坏原有约束、为什么不能直接 merge。"
            rows={3}
            value={draft.impact}
          />
        </label>

        <label className="form-field">
          <span>建议怎么修？</span>
          <textarea
            onChange={(event) => updateDraft("fix", event.target.value)}
            placeholder="写出可执行的修复方向，而不是只说“改一下”。"
            rows={3}
            value={draft.fix}
          />
        </label>

        <label className="form-field">
          <span>测试评价：应该补什么测试？</span>
          <textarea
            onChange={(event) => updateDraft("tests", event.target.value)}
            placeholder="写出至少一个能暴露风险的测试输入。"
            rows={3}
            value={draft.tests}
          />
        </label>

        <label className="form-field compact-field">
          <span>置信度</span>
          <select value={draft.confidence} onChange={(event) => updateDraft("confidence", event.target.value)}>
            <option value="high">高 - 我能明确指出阻塞问题</option>
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
          <details className="reference-disclosure">
            <summary>查看参考解析</summary>
            <div className="reference-links">
              <span className="mono">提交后参考</span>
              {referenceLinks.map((reference) => (
                <a href={reference.url} key={reference.url} rel="noreferrer" target="_blank">
                  {reference.label}
                </a>
              ))}
            </div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
