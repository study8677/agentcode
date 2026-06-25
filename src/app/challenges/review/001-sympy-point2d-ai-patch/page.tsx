import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import Link from "next/link";

import { ReviewSubmissionForm } from "@/components/challenges/ReviewSubmissionForm";
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
            <a href="#diff">AI 补丁</a>
            <a href="#submit">提交审核</a>
            <a href="#rubric">评分</a>
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
            <span className="pill">Python / SymPy</span>
          </div>
          <h1>这个 AI 修复能合并吗？</h1>
          <p>
            你正在审核一个 AI agent 生成的补丁。补丁声称修复 SymPy 中 `Point2D` 在 `evaluate(False)`
            下误报 `Imaginary coordinates are not permitted` 的问题。
          </p>
          <div className="source-grid">
            <a href="https://github.com/sympy/sympy/issues/22684" rel="noreferrer" target="_blank">
              原始 Issue
            </a>
            <a href="https://arxiv.org/abs/2503.15223" rel="noreferrer" target="_blank">
              论文来源
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
                  阅读下面的 AI PR diff，判断它是否可以 merge。如果不能，需要指出具体问题、影响和修复建议。你不需要了解整个
                  SymPy 项目，只需要围绕本页给出的行为规则和 diff 做判断。
                </p>
                <div className="review-template">
                  <pre>{`是否可以合并：可以 / 不可以

问题 1：
- 严重程度：
- 问题描述：
- 影响说明：
- 修复建议：

问题 2：
...`}</pre>
                </div>
              </div>
            </section>

            <section className="challenge-section card">
              <div className="card-head">
                <h2>题目上下文</h2>
                <span className="mono">Python</span>
              </div>
              <div className="section-body">
                <p>
                  `Point` / `Point2D` 是 SymPy 里的几何点对象。坐标必须是合法的 SymPy 表达式，并且不能是明确的虚数坐标。
                </p>
                <p>
                  `evaluate(False)` 表示临时关闭部分自动化简。真实 issue 的问题是：关闭自动化简后，普通坐标也可能被旧逻辑误判，
                  从而抛出 `Imaginary coordinates are not permitted`。
                </p>
                <p>
                  所以这道题的关键不是“只要不报错就行”，而是判断 AI 补丁有没有同时保住两个行为：普通坐标不要误杀，明确的虚数坐标仍然要拒绝。
                </p>
              </div>
            </section>

            <section className="challenge-section card">
              <div className="card-head">
                <h2>预期行为表</h2>
                <span className="mono">review hints</span>
              </div>
              <div className="behavior-table-wrap">
                <table className="behavior-table">
                  <thead>
                    <tr>
                      <th>输入场景</th>
                      <th>期望行为</th>
                      <th>审核时要看什么</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>with evaluate(False): Point(1, 2)</code>
                      </td>
                      <td>应该允许创建点</td>
                      <td>不能再误报 imaginary coordinates</td>
                    </tr>
                    <tr>
                      <td>
                        <code>with evaluate(False): Point(I, 2)</code>
                      </td>
                      <td>应该继续抛出错误</td>
                      <td>检查这个约束在补丁后是否仍成立</td>
                    </tr>
                    <tr>
                      <td>
                        <code>Point(x, y)</code>
                      </td>
                      <td>符号输入不应被粗暴拒绝</td>
                      <td>不确定是否为虚数时，不能当成明确非法</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="challenge-section card" id="diff">
              <div className="card-head">
                <h2>AI PR 变更</h2>
                <span className="mono">ai-pr.diff</span>
              </div>
              <pre className="diff-block">{diff}</pre>
            </section>

            <ReviewSubmissionForm />
          </article>

          <aside className="challenge-side">
            <section className="card">
              <div className="card-head">
                <h2>快速判断</h2>
              </div>
              <div className="section-body compact">
                <p>
                  语言：Python。
                </p>
                <p>
                  类型：Review Mode，不要求你改代码。
                </p>
                <p>
                  目标：判断 AI PR 能否合并，并写出 review findings。
                </p>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>看 Diff 顺序</h2>
              </div>
              <div className="section-body compact">
                <p>1. 先看 AI 改了哪一行判断条件。</p>
                <p>2. 再看新增测试只覆盖了什么场景。</p>
                <p>3. 最后用行为表检查是否有回归。</p>
              </div>
            </section>

            <section className="card" id="rubric">
              <div className="card-head">
                <h2>评分重点</h2>
              </div>
              <div className="rubric-list">
                <div className="rubric-item">
                  <span>合并判断</span>
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
