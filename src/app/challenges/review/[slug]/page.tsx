import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewSubmissionForm } from "@/components/challenges/ReviewSubmissionForm";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { getReviewChallenge, getReviewChallengeSlugs } from "@/lib/challenges/review";

type ReviewChallengePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getReviewChallengeSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ReviewChallengePageProps): Promise<Metadata> {
  const { slug } = await params;
  const challenge = getReviewChallenge(slug);

  if (!challenge) {
    return {};
  }

  return {
    title: `Review ${challenge.metadata.order.toString().padStart(3, "0")}: ${challenge.metadata.title.en} | AgentCode`,
    description: challenge.metadata.summary.en
  };
}

export default async function ReviewChallengePage({ params }: ReviewChallengePageProps) {
  const { slug } = await params;
  const challenge = getReviewChallenge(slug);

  if (!challenge) {
    notFound();
  }

  const { metadata, diff } = challenge;
  const displayId = metadata.order.toString().padStart(3, "0");

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
              Review {displayId}
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
            <strong>真实来源改编</strong> {metadata.source.project} 案例，改编为 AI PR 审核题。
          </span>
          <span className="mono">Review {displayId}</span>
        </div>

        <section className="challenge-header card">
          <div className="challenge-kicker">
            <span className="id">{displayId}</span>
            <Badge tone="review">Review</Badge>
            <Badge tone={metadata.difficulty}>{metadata.difficulty}</Badge>
            <span className="pill">{metadata.language}</span>
          </div>
          <h1>{metadata.title.zh}</h1>
          <p>{metadata.scenario}</p>
          <div className="source-grid">
            {metadata.source.references.map((reference) => (
              <a href={reference.url} key={reference.url} rel="noreferrer" target="_blank">
                {reference.label}
              </a>
            ))}
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
                  阅读下面的 AI PR diff，判断它是否可以 merge。如果不能，需要指出具体问题、影响和修复建议。你不需要掌握完整项目，
                  只需要围绕本页给出的行为规则、来源背景和 diff 做判断。
                </p>
                <div className="review-template">
                  <pre>{`是否可以合并：可以 / 不可以 / 需要更多信息

总体结论：

Blocking finding：
- 严重程度：
- 问题描述：
- 影响说明：
- 修复建议：

测试评价：
- 应该补充的反例或边界测试：`}</pre>
                </div>
              </div>
            </section>

            <section className="challenge-section card">
              <div className="card-head">
                <h2>题目上下文</h2>
                <span className="mono">{metadata.source.project}</span>
              </div>
              <div className="section-body">
                {metadata.context.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </section>

            <section className="challenge-section card">
              <div className="card-head">
                <h2>术语速查</h2>
                <span className="mono">review vocabulary</span>
              </div>
              <div className="term-grid">
                {metadata.terms.map((item) => (
                  <div className="term-item" key={item.term}>
                    <strong>{item.term}</strong>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="challenge-section card" id="review-flow">
              <div className="card-head">
                <h2>推荐审核流程</h2>
                <span className="mono">review path</span>
              </div>
              <ol className="review-flow">
                {metadata.reviewFocus.map((item) => (
                  <li key={item}>
                    <strong>{item}</strong>
                    <span>把这个点和 diff、测试、原有约束对照起来，判断它是否足以阻塞合并。</span>
                  </li>
                ))}
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
                      <th>输入 / 场景</th>
                      <th>原有约束</th>
                      <th>你要验证的问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.behaviorChecks.map((item) => (
                      <tr key={`${item.input}-${item.reviewQuestion}`}>
                        <td>{item.input}</td>
                        <td>{item.expected}</td>
                        <td>{item.reviewQuestion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="challenge-section card" id="diff">
              <div className="card-head">
                <h2>AI PR 变更</h2>
                <span className="mono">{metadata.reviewTarget.file}</span>
              </div>
              <pre className="diff-block">{diff}</pre>
            </section>

            <ReviewSubmissionForm
              challengeId={metadata.id}
              referenceLinks={metadata.source.references}
              scoringHints={metadata.scoringHints}
            />
          </article>

          <aside className="challenge-side">
            <section className="card">
              <div className="card-head">
                <h2>快速判断</h2>
              </div>
              <div className="section-body compact">
                <p>语言 / 领域：{metadata.language}。</p>
                <p>类型：Review Mode，不要求你改代码。</p>
                <p>目标：{metadata.learningGoal}</p>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>审核顺序</h2>
              </div>
              <div className="section-body compact">
                <p>1. 看 AI 改了哪一处判断或配置。</p>
                <p>2. 检查新增测试是否只覆盖正向场景。</p>
                <p>3. 对照原有安全、兼容性或数据语义约束。</p>
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
                  <span>核心风险</span>
                  <strong>30%</strong>
                </div>
                <div className="rubric-item">
                  <span>边界语义</span>
                  <strong>15%</strong>
                </div>
                <div className="rubric-item">
                  <span>测试质量</span>
                  <strong>10%</strong>
                </div>
                <div className="rubric-item">
                  <span>修复建议</span>
                  <strong>15%</strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
