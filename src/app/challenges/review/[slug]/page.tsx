import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewWorkspace } from "@/components/challenges/ReviewWorkspace";
import { AppShell } from "@/components/layout/AppShell";
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

  const { metadata, files } = challenge;
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
            <a className="active" href="#files">
              Review {metadata.order.toString().padStart(3, "0")}
            </a>
            <a href="#files">题目文件</a>
            <a href="#submit">提交 Review</a>
          </nav>
          <div className="actions">
            <Link className="button button-outline" href="/">
              返回题库
            </Link>
          </div>
        </div>
      </header>

      <ReviewWorkspace
        background={background}
        challengeId={metadata.id}
        challengeSlug={metadata.slug}
        defaultFileName={metadata.reviewTarget.file}
        difficulty={metadata.difficulty}
        files={files}
        language={metadata.language}
        order={metadata.order}
        pr={pr}
        sourceProject={metadata.source.project}
        summary={metadata.summary}
        title={metadata.title}
      />
    </AppShell>
  );
}
