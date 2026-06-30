import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewFileBrowser } from "@/components/challenges/ReviewFileBrowser";
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

  const { metadata, files } = challenge;
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
            <a href="#files">题目文件</a>
            <a href="#checks">审查清单</a>
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
                  打开题目文件，重点审查 AI PR diff 是否可以 merge。如果不能，需要指出具体问题、影响、反例测试和修复建议。
                </p>
              </div>
            </section>

            <ReviewFileBrowser files={files} defaultFileName={metadata.reviewTarget.file} />

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

            <section className="challenge-section card" id="checks">
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
