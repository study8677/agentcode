import type { PracticeStats } from "@/lib/types/problem";

type ProblemStatsStripProps = {
  stats: PracticeStats;
  labels: {
    seedChallenges: string;
    taskMode: string;
    reviewMode: string;
  };
};

export function ProblemStatsStrip({ stats, labels }: ProblemStatsStripProps) {
  return (
    <div className="stats" aria-label="V0 stats">
      <div className="stat">
        <span>{labels.seedChallenges}</span>
        <strong>{stats.seedChallenges}</strong>
      </div>
      <div className="stat">
        <span>{labels.taskMode}</span>
        <strong>{stats.taskMode}</strong>
      </div>
      <div className="stat">
        <span>{labels.reviewMode}</span>
        <strong>{stats.reviewMode}</strong>
      </div>
    </div>
  );
}
