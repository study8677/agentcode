"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TopNav } from "@/components/layout/TopNav";
import { ActivityPanel } from "@/components/problems/ActivityPanel";
import { copy, type Language } from "@/components/problems/copy";
import { DailyChallengeCard } from "@/components/problems/DailyChallengeCard";
import { ProblemList } from "@/components/problems/ProblemList";
import { ProblemStatsStrip } from "@/components/problems/ProblemStatsStrip";
import { ProblemToolbar } from "@/components/problems/ProblemToolbar";
import { ReviewProfileCard, type ReviewProfileData } from "@/components/problems/ReviewProfileCard";
import { TopicSidebar } from "@/components/problems/TopicSidebar";
import type { Challenge, PracticeStats } from "@/lib/types/problem";

type PracticeHomeProps = {
  challenges: Challenge[];
  practiceStats: PracticeStats;
};

export function PracticeHome({ challenges, practiceStats }: PracticeHomeProps) {
  const [language, setLanguage] = useState<Language>("zh");
  const [profile, setProfile] = useState<ReviewProfileData | null>(null);
  const [acceptanceRates, setAcceptanceRates] = useState<Record<string, number>>({});
  const labels = copy[language];
  const liveStats = profile
    ? { ...practiceStats, reviewProgress: profile.progress.finalized }
    : practiceStats;
  const firstChallengeHref = profile?.nextChallenge?.href ?? challenges[0]?.href ?? "#";
  const liveChallenges = challenges.map((challenge) => {
    const slug = challenge.href?.split("/").pop() ?? "";
    return { ...challenge, acceptanceRate: acceptanceRates[slug] ?? null };
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/review/profile", { credentials: "same-origin" })
      .then((response) => response.ok ? response.json() as Promise<ReviewProfileData> : null)
      .then((value) => {
        if (!cancelled && value) {
          setProfile(value);
        }
      })
      .catch(() => undefined);
    fetch("/api/review/stats")
      .then((response) => response.ok ? response.json() as Promise<{ publishable: boolean; acceptanceRates: Record<string, number> }> : null)
      .then((value) => {
        if (!cancelled && value?.publishable) {
          setAcceptanceRates(value.acceptanceRates);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <TopNav language={language} labels={labels} onLanguageChange={setLanguage} />
      <main className="page">
        <div className="notice">
          <span>
            <strong>{labels.noticeStrong}</strong> {labels.notice}
          </span>
          <span className="mono">agentcode.codes</span>
        </div>

        <section className="hero">
          <div className="hero-main">
            <div>
              <div className="eyebrow">{labels.eyebrow}</div>
              <h1>{labels.headline}</h1>
              <p className="lede">{labels.lede}</p>
              <div className="hero-actions">
                <Link className="button button-primary" href={firstChallengeHref}>
                  {labels.startTask}
                </Link>
                <a
                  className="button button-outline"
                  href="https://github.com/study8677/agentcode/blob/main/plan.md"
                  rel="noreferrer"
                  target="_blank"
                >
                  {labels.viewRoadmap}
                </a>
              </div>
            </div>

            <ProblemStatsStrip stats={liveStats} labels={labels} />
          </div>

          <ProblemToolbar labels={labels} />
        </section>

        <div className="layout">
          <ProblemList challenges={liveChallenges} labels={labels} language={language} />

          <aside className="side">
            <DailyChallengeCard stats={liveStats} labels={labels} />
            {profile ? <ReviewProfileCard language={language} profile={profile} /> : <ActivityPanel labels={labels} />}
            <TopicSidebar labels={labels} />
          </aside>
        </div>
      </main>
    </>
  );
}
