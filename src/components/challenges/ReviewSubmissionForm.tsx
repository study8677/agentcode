"use client";

import { useEffect, useMemo, useState } from "react";

type MergeDecision = "yes" | "no" | "";

type ReviewDraft = {
  mergeDecision: MergeDecision;
  severity: string;
  problem: string;
  impact: string;
  fix: string;
  tests: string;
};

type Feedback = {
  score: number;
  checks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
};

const storageKey = "agentcode.review.001.draft";

const initialDraft: ReviewDraft = {
  mergeDecision: "",
  severity: "high",
  problem: "",
  impact: "",
  fix: "",
  tests: ""
};

const template = `是否可以合并：不可以

问题 1：
- 严重程度：高
- 问题描述：
- 影响说明：
- 修复建议：

问题 2：
- 严重程度：
- 问题描述：
- 影响说明：
- 修复建议：`;

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function scoreDraft(draft: ReviewDraft): Feedback {
  const body = `${draft.problem}\n${draft.impact}\n${draft.fix}\n${draft.tests}`.toLowerCase();
  const mergePassed = draft.mergeDecision === "no";
  const regressionPassed =
    includesAny(body, ["evaluate(false)", "evaluate"]) &&
    includesAny(body, ["虚数", "imaginary", "point(i", "i, 2"]) &&
    includesAny(body, ["绕过", "跳过", "禁用", "放过", "允许", "bypass", "skip", "allow"]);
  const semanticPassed =
    includesAny(body, ["明确", "确定", "clearly", "definitely", "is_zero"]) &&
    includesAny(body, ["虚数", "imaginary"]) &&
    includesAny(body, ["不确定", "unknown", "符号", "symbol"]);
  const testPassed =
    includesAny(body, ["测试", "test"]) &&
    includesAny(body, ["point(i", "i, 2", "虚数坐标", "imaginary coordinate", "negative"]);
  const fixPassed =
    includesAny(body, ["is_zero", "im(a).is_zero", "不要用 evaluate", "不能用 evaluate", "keep the guard"]) ||
    (includesAny(body, ["保留", "继续执行", "不能跳过"]) && includesAny(body, ["虚数", "imaginary"]));

  const checks = [
    {
      label: "合并判断",
      passed: mergePassed,
      detail: mergePassed ? "你判断为不能合并。" : "这道题的关键是识别该 PR 不能直接合并。"
    },
    {
      label: "核心回归",
      passed: regressionPassed,
      detail: regressionPassed
        ? "你指出了 evaluate(False) 下虚数坐标检查被绕过的风险。"
        : "需要说明：这个补丁会让明确的虚数坐标在 evaluate(False) 下绕过校验。"
    },
    {
      label: "语义边界",
      passed: semanticPassed,
      detail: semanticPassed
        ? "你区分了不确定的符号输入和明确的虚数输入。"
        : "需要区分：不确定是否为虚数的符号值不能误杀，但明确虚数仍必须拒绝。"
    },
    {
      label: "测试覆盖",
      passed: testPassed,
      detail: testPassed
        ? "你提到了需要补充 evaluate(False) 下的虚数负例测试。"
        : "需要指出 AI 只测了 Point(1, 2)，没有测 Point(I, 2) 这类负例。"
    },
    {
      label: "修复建议",
      passed: fixPassed,
      detail: fixPassed
        ? "你的修复方向接近 oracle：保留校验，用更精确的谓词判断虚部。"
        : "建议写出修复方向：不要用 evaluate 包住整段校验，可用 im(a).is_zero is False 这类确定性判断。"
    }
  ];

  const score = checks.reduce((total, check, index) => {
    const weights = [30, 30, 15, 10, 15];
    return total + (check.passed ? weights[index] : 0);
  }, 0);

  return { score, checks };
}

export function ReviewSubmissionForm() {
  const [draft, setDraft] = useState<ReviewDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const feedback = useMemo(() => scoreDraft(draft), [draft]);

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
  }, []);

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

  const canSubmit = draft.mergeDecision && draft.problem.trim().length >= 20 && draft.impact.trim().length >= 10;

  return (
    <section className="challenge-section card" id="submit">
      <div className="card-head">
        <h2>提交你的审核</h2>
        <span className="mono">V0 本地初评</span>
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
            <span>不能合并，需要 request changes</span>
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
        </fieldset>

        <label className="form-field">
          <span>严重程度</span>
          <select value={draft.severity} onChange={(event) => updateDraft("severity", event.target.value)}>
            <option value="high">High - 会引入错误行为或回归</option>
            <option value="medium">Medium - 边界缺失或测试不足</option>
            <option value="low">Low - 可维护性或表达问题</option>
          </select>
        </label>

        <label className="form-field">
          <span>核心问题是什么？</span>
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
          <span>应该补什么测试？</span>
          <textarea
            onChange={(event) => updateDraft("tests", event.target.value)}
            placeholder="写出至少一个能暴露风险的测试输入。"
            rows={3}
            value={draft.tests}
          />
        </label>

        <div className="form-actions">
          <button className="button button-primary" disabled={!canSubmit} type="submit">
            提交审核
          </button>
          <button className="button button-outline" onClick={saveDraft} type="button">
            保存草稿
          </button>
          <button className="button button-outline" onClick={copyTemplate} type="button">
            {copied ? "已复制" : "复制模板"}
          </button>
          <button className="button button-ghost" onClick={resetDraft} type="button">
            清空
          </button>
          {saved ? <span className="form-note">草稿已保存在当前浏览器。</span> : null}
        </div>
      </form>

      {submitted ? (
        <div className="feedback-panel">
          <div>
            <span className="mono">初步得分</span>
            <strong>{feedback.score}/100</strong>
          </div>
          <p>这是前端本地规则的即时反馈，用来帮助你练习。后续会接入账号、数据库和更完整的评分记录。</p>
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
          <div className="reference-links">
            <span className="mono">提交后参考</span>
            <a href="https://github.com/sympy/sympy/pull/22714" rel="noreferrer" target="_blank">
              上游正确 PR
            </a>
            <a href="https://arxiv.org/abs/2503.15223" rel="noreferrer" target="_blank">
              PatchDiff 论文分析
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
