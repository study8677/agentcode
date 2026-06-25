import type { ChallengeDifficulty, ChallengeMode, ChallengeStatus } from "@/lib/types/problem";
import type { ReactNode } from "react";

type BadgeTone = ChallengeMode | ChallengeDifficulty | ChallengeStatus | "neutral";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
