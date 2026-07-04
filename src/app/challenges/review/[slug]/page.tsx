import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewFileBrowser } from "@/components/challenges/ReviewFileBrowser";
import { ReviewSubmissionForm } from "@/components/challenges/ReviewSubmissionForm";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import {
  getReviewBackground,
  getReviewChallenge,
  getReviewChallengeSlugs,
  getReviewPrBrief
} from "@/lib/challenges/review";

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

  const { metadata, files, reveal } = challenge;
  const displayId = metadata.order.toString().padStart(3, "0");
  const pr = getReviewPrBrief(metadata);
  const background = getReviewBackground(metadata);

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
            <strong>真实来源改编</strong> {metadata.source.project} 案例，改编为 AI PR 审核题。上游来源在提交 review 后展示。
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
          <p>{metadata.summary.zh}</p>
        </section>

        <div className="challenge-layout">
          <article className="challenge-main">
            <section className="challenge-section card" id="review">
              <div className="card-head">
                <h2>待审核的 PR</h2>
                <span className="mono">
                  {pr.author} · CI passed
                </span>
              </div>
              <div className="section-body">
                <p>
                  <strong>{pr.title}</strong>
                </p>
                {pr.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <ReviewFileBrowser files={files} defaultFileName={metadata.reviewTarget.file} />

            {background.length > 0 ? (
              <section className="challenge-section card">
                <div className="card-head">
                  <h2>背景</h2>
                  <span className="mono">{metadata.source.project}</span>
                </div>
                <div className="section-body">
                  {background.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </section>
            ) : null}

            <ReviewSubmissionForm
              challengeId={metadata.id}
              scoringHints={metadata.scoringHints}
              reveal={reveal}
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
                <p>你是 reviewer：这个 PR 的结论由你负责，可以合并、不能合并、需要更多信息都可能是正确答案。</p>
                <p>可以使用任何 AI 工具辅助，但评分看的是你给出的证据和判断。</p>
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
