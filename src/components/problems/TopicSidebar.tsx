type TopicSidebarProps = {
  labels: {
    rubricTitle: string;
    correctness: string;
    testQuality: string;
    riskJudgment: string;
    maintainability: string;
  };
};

const rubricWeights = [
  ["correctness", "35%"],
  ["testQuality", "25%"],
  ["riskJudgment", "25%"],
  ["maintainability", "15%"]
] as const;

export function TopicSidebar({ labels }: TopicSidebarProps) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{labels.rubricTitle}</h2>
      </div>
      <div className="rubric-list">
        {rubricWeights.map(([key, value]) => (
          <div className="rubric-item" key={key}>
            <span>{labels[key]}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
