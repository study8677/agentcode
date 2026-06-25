import { Badge } from "@/components/ui/Badge";

type ActivityPanelProps = {
  labels: {
    reviewPreview: string;
    practice: string;
    reviewBadge: string;
  };
};

export function ActivityPanel({ labels }: ActivityPanelProps) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{labels.reviewPreview}</h2>
        <a href="#">{labels.practice}</a>
      </div>
      <div className="review-card">
        <div className="pr-line">
          <div>
            <span className="plus">+</span> if (!team) return 404
          </div>
          <div>
            <span className="minus">-</span> await requireTeamOwner(user.id, teamId)
          </div>
          <div>
            -&gt; verdict: <strong>request_changes</strong>
          </div>
        </div>
        <Badge tone="review">{labels.reviewBadge}</Badge>
      </div>
    </section>
  );
}
