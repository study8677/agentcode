import Link from "next/link";

export type ReviewProfileData = {
  progress: {
    finalized: number;
    pending: number;
    total: number;
  };
  overallScore: number | null;
  skills: Array<{
    skill: string;
    score: number;
    samples: number;
    confidence: "low" | "medium" | "high";
  }>;
  nextChallenge: {
    slug: string;
    title: { zh: string; en: string };
    difficulty: string;
    href: string;
  } | null;
  recentAttempts: Array<{
    attemptId: string;
    challengeSlug: string;
    attemptNumber: number;
    provisionalScore: unknown;
    finalScore: number | null;
    status: "pending" | "adjudicated";
  }>;
};

type ReviewProfileCardProps = {
  profile: ReviewProfileData;
  language: "zh" | "en";
};

export function ReviewProfileCard({ profile, language }: ReviewProfileCardProps) {
  const zh = language === "zh";

  return (
    <section className="card">
      <div className="card-head">
        <h2>{zh ? "Review 能力画像" : "Review profile"}</h2>
        <span className="mono">
          {profile.overallScore === null ? (zh ? "样本不足" : "Not enough data") : `${profile.overallScore}/100`}
        </span>
      </div>
      <p>
        {zh ? "已终审" : "Finalized"} {profile.progress.finalized} · {zh ? "待终审" : "Pending"} {profile.progress.pending}
      </p>
      {profile.skills.length > 0 ? (
        <div className="feedback-checks">
          {profile.skills.slice(0, 3).map((skill) => (
            <div className="feedback-check" key={skill.skill}>
              <span>{skill.score}</span>
              <div>
                <strong>{skill.skill}</strong>
                <p>{skill.samples} samples · {skill.confidence} confidence</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>{zh ? "完成并等待第一道题终审后生成画像。" : "Your profile appears after the first final adjudication."}</p>
      )}
      {profile.nextChallenge ? (
        <Link className="button button-primary" href={profile.nextChallenge.href}>
          {zh ? "继续下一题" : "Continue"} · {profile.nextChallenge.title[language]}
        </Link>
      ) : null}
      {profile.recentAttempts.length > 0 ? (
        <details className="review-context-group">
          <summary>{zh ? "最近提交" : "Recent attempts"}</summary>
          <div className="section-body compact">
            {profile.recentAttempts.slice(0, 5).map((attempt) => (
              <p key={attempt.attemptId}>
                <strong>{attempt.challengeSlug}</strong> · #{attempt.attemptNumber} · {attempt.status === "pending"
                  ? (zh ? "待终审" : "Pending")
                  : `${attempt.finalScore ?? "-"}/100`}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
