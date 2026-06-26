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
            <a href="#review-flow">审核流程</a>
            <a href="#diff">AI 补丁</a>
            <a href="#submit">提交 Review</a>
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
                  <pre>{`是否可以合并：可以 / 不可以 / 需要更多信息

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
                  这道题要练的是 code review 判断力：一个补丁修好 happy path 之后，是否仍然保留了原有输入约束和边界语义。
                </p>
              </div>
            </section>

            <section className="challenge-section card">
              <div className="card-head">
                <h2>术语速查</h2>
                <span className="mono">不用先学完整 SymPy</span>
              </div>
              <div className="term-grid">
                <div className="term-item">
                  <strong>PR / diff</strong>
                  <p>PR 是一次代码变更提议，diff 展示这次变更具体改了哪些行。</p>
                </div>
                <div className="term-item">
                  <strong>merge / request changes</strong>
                  <p>merge 表示接受变更；request changes 表示发现必须修复的问题，暂时不能进主分支。</p>
                </div>
                <div className="term-item">
                  <strong>回归</strong>
                  <p>修一个问题时，把原本正确的行为弄坏。Review Mode 很多题都在考这个。</p>
                </div>
                <div className="term-item">
                  <strong>边界条件 / 负例测试</strong>
                  <p>边界条件是容易暴露错误的输入；负例测试用来确认非法输入仍然会被拒绝。</p>
                </div>
                <div className="term-item">
                  <strong>Point / Point2D</strong>
                  <p>SymPy 里的几何点对象。这里你只需要知道：点坐标有一组原有合法性约束。</p>
                </div>
                <div className="term-item">
                  <strong>evaluate(False)</strong>
                  <p>临时关闭部分自动化简。它可能让表达式保持未化简状态，所以要留意分支判断是否被影响。</p>
                </div>
                <div className="term-item">
                  <strong>im(a)</strong>
                  <p>读取表达式 a 的虚部。你不需要掌握 SymPy 内部，只要知道它参与坐标合法性判断。</p>
                </div>
                <div className="term-item">
                  <strong>a.is_number</strong>
                  <p>判断 a 是否是具体数值。审核时要看它被放进条件判断后，是否改变了输入分类。</p>
                </div>
              </div>
            </section>

            <section className="challenge-section card" id="review-flow">
              <div className="card-head">
                <h2>推荐审核流程</h2>
                <span className="mono">review path</span>
              </div>
              <ol className="review-flow">
                <li>
                  <strong>先看改动点</strong>
                  <span>先确认 PR 声称修复什么用户问题，再看 diff 改了哪条校验逻辑。</span>
                </li>
                <li>
                  <strong>再看新增测试</strong>
                  <span>新增测试通常能证明一个正向场景，也要检查是否覆盖了反向场景和边界输入。</span>
                </li>
                <li>
                  <strong>对照原有约束</strong>
                  <span>判断补丁是精确修复，还是只让某个 case 通过并顺手放宽了旧规则。</span>
                </li>
                <li>
                  <strong>主动找反例</strong>
                  <span>想一类补丁作者没有写进测试、但原有约束必须继续成立的输入。</span>
                </li>
                <li>
                  <strong>给出 merge 结论</strong>
                  <span>如果有回归风险，就写出 blocking finding、影响和可执行修复方向。</span>
                </li>
              </ol>
            </section>

            <section className="challenge-section card">
              <div className="card-head">
                <h2>审查清单</h2>
                <span className="mono">不要只看 happy path</span>
              </div>
              <div className="behavior-table-wrap">
                <table className="behavior-table">
                  <thead>
                    <tr>
                      <th>输入类型</th>
                      <th>原有约束</th>
                      <th>你要验证的问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        普通数值坐标
                      </td>
                      <td>不应因为关闭自动化简被误拒</td>
                      <td>新增测试是否只证明了这个正向场景</td>
                    </tr>
                    <tr>
                      <td>明显非法的坐标</td>
                      <td>原有非法输入校验仍应清楚可解释</td>
                      <td>PR 是否改变了合法 / 非法输入的分类边界</td>
                    </tr>
                    <tr>
                      <td>
                        无法静态确定的符号坐标
                      </td>
                      <td>不应被粗暴当成非法输入</td>
                      <td>条件判断是否把 unknown 和 invalid 混成一种</td>
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
                <h2>审核顺序</h2>
              </div>
              <div className="section-body compact">
                <p>1. 看 AI 改了哪一行条件。</p>
                <p>2. 检查新增测试是否覆盖正例和反例。</p>
                <p>3. 对照原有约束找回归风险。</p>
                <p>4. 写出能阻止 merge 的 finding。</p>
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
