import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { Language } from "@/components/problems/copy";
import type { Challenge } from "@/lib/types/problem";

type ProblemRowProps = {
  challenge: Challenge;
  labels: {
    tableTitle: string;
    tableMode: string;
    tableDifficulty: string;
    tableAcceptance: string;
    tableStatus: string;
    task: string;
    review: string;
    junior: string;
    mid: string;
    senior: string;
    ready: string;
    draft: string;
    needsReview: string;
  };
  language: Language;
};

const difficultyLabelKey = {
  junior: "junior",
  mid: "mid",
  senior: "senior"
} as const;

const statusLabelKey = {
  ready: "ready",
  draft: "draft",
  "needs-review": "needsReview"
} as const;

export function ProblemRow({ challenge, labels, language }: ProblemRowProps) {
  const modeLabel = challenge.mode === "task" ? labels.task : labels.review;
  const difficultyLabel = labels[difficultyLabelKey[challenge.difficulty]];
  const statusLabel = labels[statusLabelKey[challenge.status]];

  return (
    <tr>
      <td>
        <span className="id">{challenge.id}</span>
      </td>
      <td className="title-cell">
        <span className="mobile-label">{labels.tableTitle}</span>
        {challenge.href ? (
          <Link className="challenge-title-link" href={challenge.href}>
            {challenge.title[language]}
          </Link>
        ) : (
          <strong>{challenge.title[language]}</strong>
        )}
        <span>{challenge.summary[language]}</span>
      </td>
      <td>
        <span className="mobile-label">{labels.tableMode}</span>
        <Badge tone={challenge.mode}>{modeLabel}</Badge>
      </td>
      <td>
        <span className="mobile-label">{labels.tableDifficulty}</span>
        <Badge tone={challenge.difficulty}>{difficultyLabel}</Badge>
      </td>
      <td>
        <span className="mobile-label">{labels.tableAcceptance}</span>
        <span className="mono">{challenge.acceptanceRate.toFixed(1)}%</span>
      </td>
      <td>
        <span className="mobile-label">{labels.tableStatus}</span>
        {challenge.status === "needs-review" ? (
          <Badge tone="needs-review">{statusLabel}</Badge>
        ) : (
          <span className="mono">{statusLabel}</span>
        )}
      </td>
    </tr>
  );
}
