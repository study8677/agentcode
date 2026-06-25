import type { Language } from "@/components/problems/copy";
import { ProblemRow } from "@/components/problems/ProblemRow";
import type { Challenge } from "@/lib/types/problem";

type ProblemListProps = {
  challenges: Challenge[];
  labels: {
    challengeList: string;
    seeAll: string;
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

export function ProblemList({ challenges, labels, language }: ProblemListProps) {
  return (
    <section className="card" aria-label="Challenge list">
      <div className="card-head">
        <h2>{labels.challengeList}</h2>
        <a href="#">{labels.seeAll}</a>
      </div>

      <table className="problem-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{labels.tableTitle}</th>
            <th>{labels.tableMode}</th>
            <th>{labels.tableDifficulty}</th>
            <th>{labels.tableAcceptance}</th>
            <th>{labels.tableStatus}</th>
          </tr>
        </thead>
        <tbody>
          {challenges.map((challenge) => (
            <ProblemRow key={challenge.id} challenge={challenge} labels={labels} language={language} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
