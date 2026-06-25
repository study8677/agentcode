import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ProblemToolbarProps = {
  labels: {
    search: string;
    filterAll: string;
    filterDifficulty: string;
    filterStatus: string;
  };
};

export function ProblemToolbar({ labels }: ProblemToolbarProps) {
  return (
    <div className="filters">
      <Input placeholder={labels.search} />
      <Button variant="outline" type="button">
        {labels.filterAll}
      </Button>
      <Button variant="outline" type="button">
        {labels.filterDifficulty}
      </Button>
      <Button variant="outline" type="button">
        {labels.filterStatus}
      </Button>
    </div>
  );
}
