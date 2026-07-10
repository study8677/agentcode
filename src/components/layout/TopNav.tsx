import type { Language } from "@/components/problems/copy";
import { Button } from "@/components/ui/Button";

type TopNavProps = {
  language: Language;
  labels: {
    navProblems: string;
    navTasks: string;
    navReviews: string;
    navRubrics: string;
    navDiscuss: string;
    login: string;
  };
  onLanguageChange: (language: Language) => void;
};

export function TopNav({ language, labels, onLanguageChange }: TopNavProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#">
          <span className="brand-mark">AC</span>
          <strong>AgentCode</strong>
        </a>

        <nav className="nav" aria-label="Primary navigation">
          <a className="active" href="#">
            {labels.navProblems}
          </a>
          <a href="#">{labels.navTasks}</a>
          <a href="#">{labels.navReviews}</a>
          <a href="#">{labels.navRubrics}</a>
          <a href="#">{labels.navDiscuss}</a>
        </nav>

        <div className="actions">
          <div className="language-switch" aria-label="Language">
            <button
              className={language === "zh" ? "active" : ""}
              type="button"
              onClick={() => onLanguageChange("zh")}
            >
              中
            </button>
            <button
              className={language === "en" ? "active" : ""}
              type="button"
              onClick={() => onLanguageChange("en")}
            >
              EN
            </button>
          </div>
          <Button disabled title={language === "zh" ? "提交会保存在匿名训练会话中" : "Submissions are stored in an anonymous practice session"} variant="outline">
            {labels.login}
          </Button>
        </div>
      </div>
    </header>
  );
}
