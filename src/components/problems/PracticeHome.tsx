"use client";

import { useState } from "react";

import { TopNav } from "@/components/layout/TopNav";
import { ActivityPanel } from "@/components/problems/ActivityPanel";
import { copy, type Language } from "@/components/problems/copy";
import { DailyChallengeCard } from "@/components/problems/DailyChallengeCard";
import { ProblemList } from "@/components/problems/ProblemList";
import { ProblemStatsStrip } from "@/components/problems/ProblemStatsStrip";
import { ProblemToolbar } from "@/components/problems/ProblemToolbar";
import { TopicSidebar } from "@/components/problems/TopicSidebar";
import { Button } from "@/components/ui/Button";
import { challenges, practiceStats } from "@/lib/mock-data/problems";

export function PracticeHome() {
  const [language, setLanguage] = useState<Language>("zh");
  const labels = copy[language];

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
                <Button type="button">{labels.startTask}</Button>
                <Button type="button" variant="outline">
                  {labels.viewRoadmap}
                </Button>
              </div>
            </div>

            <ProblemStatsStrip stats={practiceStats} labels={labels} />
          </div>

          <ProblemToolbar labels={labels} />
        </section>

        <div className="layout">
          <ProblemList challenges={challenges} labels={labels} language={language} />

          <aside className="side">
            <DailyChallengeCard stats={practiceStats} labels={labels} />
            <ActivityPanel labels={labels} />
            <TopicSidebar labels={labels} />
          </aside>
        </div>
      </main>
    </>
  );
}
