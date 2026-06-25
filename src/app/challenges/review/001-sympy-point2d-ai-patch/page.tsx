import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";

const challengeDir = "challenges/review/001-sympy-point2d-ai-patch";
const diff = readFileSync(join(process.cwd(), challengeDir, "ai-pr.diff"), "utf8");

export const metadata: Metadata = {
  title: "Review 001: SymPy Point2D AI Patch | AgentCode",
  description: "Review a real SWE-bench/SymPy AI patch and decide whether it can be merged."
};

export default function FirstReviewChallengePage() {
  return (
    <AppShell>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-mark">AC</span>
            <strong>AgentCode</strong>
          </Link>
          <nav className="nav" aria-label="Challenge navigation">
            <Link href="/">题库</Link>
            <a className="active" href="#review">
              第一题
            </a>
            <a href="#diff">AI Diff</a>
            <a href="#rubric">Rubric</a>
          </nav>
          <div className="actions">
            <Link className="button button-outline" href="/">
              返回题库
            </Link>
          </div>
        </div>
      </header>

      <main className="page challenge-page">
        <div className="notice">
          <span>
            <strong>真实来源改编</strong> SymPy issue + SWE-bench / PatchDiff 中的 AI 错误补丁案例。
          </span>
          <span className="mono">Review 001</span>
        </div>

        <section className="challenge-header card">
          <div className="challenge-kicker">
            <span className="id">001</span>
            <Badge tone="review">Review</Badge>
            <Badge tone="mid">Mid</Badge>
          </div>
          <h1>这个 AI 修复能合并吗？</h1>
          <p>
            你正在审核一个 AI agent 生成的补丁。补丁声称修复 SymPy 中 `Point2D` 在 `evaluate(False)`
            下误报 `Imaginary coordinates are not permitted` 的问题。
          </p>
          <div className="source-grid">
            <a href="https://github.com/sympy/sympy/issues/22684" rel="noreferrer" target="_blank">
              SymPy Issue
            </a>
            <a href="https://github.com/sympy/sympy/pull/22714" rel="noreferrer" target="_blank">
              Correct PR
            </a>
            <a href="https://arxiv.org/abs/2503.15223" rel="noreferrer" target="_blank">
              PatchDiff Paper
            </a>
          </div>
        </section>

        <div className="challenge-layout">
          <article className="challenge-main">
            <section className="challenge-section card" id="review">
              <div className="card-head">
                <h2>你的任务</h2>
              </div>
              <div className="section-body">
                <p>
                  阅读下面的 AI PR diff，判断它是否可以 merge。如果不能，需要指出具体问题、影响和修复建议。
                </p>
                <div className="review-template">
                  <pre>{`Can merge? Yes / No

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Finding 2:
...`}</pre>
                </div>
              </div>
            </section>

            <section className="challenge-section card" id="diff">
              <div className="card-head">
                <h2>AI PR Diff</h2>
                <span className="mono">ai-pr.diff</span>
              </div>
              <pre className="diff-block">{diff}</pre>
            </section>
          </article>

          <aside className="challenge-side">
            <section className="card">
              <div className="card-head">
                <h2>背景</h2>
              </div>
              <div className="section-body compact">
                <p>
                  SymPy `Point` / `Point2D` 不允许创建带有虚数坐标的点。真实 bug 是：
                  在 `evaluate(False)` 下，即使输入没有虚数，也可能错误抛出异常。
                </p>
                <p>
                  你要审核的是 AI 补丁，不是上游最终合并的正确修复。
                </p>
              </div>
            </section>

            <section className="card" id="rubric">
              <div className="card-head">
                <h2>评分重点</h2>
              </div>
              <div className="rubric-list">
                <div className="rubric-item">
                  <span>Merge 判断</span>
                  <strong>30%</strong>
                </div>
                <div className="rubric-item">
                  <span>回归风险</span>
                  <strong>35%</strong>
                </div>
                <div className="rubric-item">
                  <span>语义边界</span>
                  <strong>15%</strong>
                </div>
                <div className="rubric-item">
                  <span>测试质量</span>
                  <strong>10%</strong>
                </div>
                <div className="rubric-item">
                  <span>修复建议</span>
                  <strong>10%</strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
