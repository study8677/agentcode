import type { PracticeStats } from "@/lib/types/problem";

type DailyChallengeCardProps = {
  stats: PracticeStats;
  labels: {
    planTitle: string;
    planBody: string;
  };
};

export function DailyChallengeCard({ stats, labels }: DailyChallengeCardProps) {
  const taskPercent = stats.taskMode === 0 ? 0 : (stats.taskProgress / stats.taskMode) * 100;
  const reviewPercent = stats.reviewMode === 0 ? 0 : (stats.reviewProgress / stats.reviewMode) * 100;

  return (
    <section className="card plan-card">
      <h3>{labels.planTitle}</h3>
      <p>{labels.planBody}</p>
      <div className="progress">
        <div className="progress-row">
          <header>
            <span>Task Mode</span>
            <strong>
              {stats.taskMode === 0 ? "planned" : `${stats.taskProgress} / ${stats.taskMode}`}
            </strong>
          </header>
          <div className="bar">
            <i style={{ width: `${taskPercent}%` }} />
          </div>
        </div>
        <div className="progress-row">
          <header>
            <span>Review Mode</span>
            <strong>
              {stats.reviewProgress} / {stats.reviewMode}
            </strong>
          </header>
          <div className="bar">
            <i style={{ width: `${reviewPercent}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
