import { AppShell } from "@/components/layout/AppShell";
import { PracticeHome } from "@/components/problems/PracticeHome";
import { getReviewChallengeList } from "@/lib/challenges/review";
import type { PracticeStats } from "@/lib/types/problem";

export default function Home() {
  const challenges = getReviewChallengeList();
  const practiceStats: PracticeStats = {
    seedChallenges: challenges.length,
    taskMode: 0,
    reviewMode: challenges.length,
    taskProgress: 0,
    reviewProgress: 1
  };

  return (
    <AppShell>
      <PracticeHome challenges={challenges} practiceStats={practiceStats} />
    </AppShell>
  );
}
