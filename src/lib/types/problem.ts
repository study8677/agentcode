export type ChallengeMode = "task" | "review";

export type ChallengeDifficulty = "junior" | "mid" | "senior";

export type ChallengeStatus = "ready" | "draft" | "needs-review";

export type RunStatus = "idle" | "queued" | "running" | "success" | "failed";

export type LocalizedText = {
  zh: string;
  en: string;
};

export type Challenge = {
  id: string;
  href?: string;
  title: LocalizedText;
  summary: LocalizedText;
  mode: ChallengeMode;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  acceptanceRate: number | null;
  tags: string[];
  runStatus: RunStatus;
};

export type PracticeStats = {
  seedChallenges: number;
  taskMode: number;
  reviewMode: number;
  taskProgress: number;
  reviewProgress: number;
};
