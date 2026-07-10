import Link from "next/link";

import {
  authenticateReviewer,
  listReviewQueue,
  type ReviewQueueFilter
} from "@/lib/review-data";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ status?: string }> };
const filters: ReviewQueueFilter[] = ["pending", "overdue", "adjudicated", "all"];

function scoreOf(feedback: unknown) {
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) {
    return "—";
  }

  const score = (feedback as Record<string, unknown>).score;
  return typeof score === "number" ? score : "—";
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const reviewerResult = await loadReviewer();

  if (reviewerResult.unauthorized) {
    return (
      <AdminMessage
        title="需要 Reviewer 登录"
        detail="请使用 REVIEWER_GITHUB_IDS 白名单中的 GitHub 账户登录。"
        login
      />
    );
  }

  if (reviewerResult.error || !reviewerResult.reviewer) {
    return <AdminMessage title="后台鉴权尚未配置" detail={reviewerResult.error ?? "未知配置错误"} />;
  }

  const reviewer = reviewerResult.reviewer;

  const query = await searchParams;
  const filter = filters.includes(query.status as ReviewQueueFilter) ? query.status as ReviewQueueFilter : "pending";
  const queue = await loadQueue(filter);

  if (queue.error) {
    return <AdminMessage title="无法加载终审队列" detail={queue.error} />;
  }

  return (
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>AgentCode · Reviewer {reviewer.githubId}</p>
            <h1 style={styles.title}>人工终审队列</h1>
          </div>
          <Link href="/api/admin/metrics" style={styles.link}>查看指标 JSON</Link>
        </header>

        <nav style={styles.nav}>
          {filters.map((item) => (
            <Link key={item} href={`/admin/reviews?status=${item}`} style={item === filter ? styles.activeFilter : styles.filter}>
              {item}
            </Link>
          ))}
        </nav>

        <section style={styles.panel}>
          {queue.attempts.length === 0 ? <p style={styles.muted}>当前筛选下没有提交。</p> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>题目</th>
                  <th style={styles.cell}>尝试</th>
                  <th style={styles.cell}>预评分</th>
                  <th style={styles.cell}>截止时间</th>
                  <th style={styles.cell}>状态</th>
                </tr>
              </thead>
              <tbody>
                {queue.attempts.map((attempt) => {
                  return (
                    <tr key={attempt.id}>
                      <td style={styles.cell}><Link href={`/admin/reviews/${attempt.id}`} style={styles.link}>{attempt.challengeSlug}</Link></td>
                      <td style={styles.cell}>#{attempt.attemptNumber}{attempt.isFirstAttempt ? " · 首答" : " · 重试"}</td>
                      <td style={styles.cell}>{scoreOf(attempt.provisionalFeedback)}</td>
                      <td style={{ ...styles.cell, color: attempt.overdue ? "#b42318" : undefined }}>{attempt.adjudicationDeadline.toLocaleString("zh-CN")}</td>
                      <td style={styles.cell}>{attempt.status.toLowerCase()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
  );
}

async function loadReviewer() {
  try {
    return { reviewer: await authenticateReviewer(), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知配置错误";
    return { reviewer: null, error: message, unauthorized: message.includes("session is required") };
  }
}

async function loadQueue(filter: ReviewQueueFilter) {
  try {
    const now = Date.now();
    const attempts = (await listReviewQueue(filter)).map((attempt) => ({
      ...attempt,
      overdue: attempt.status === "PENDING" && attempt.adjudicationDeadline.getTime() < now
    }));
    return { attempts, error: null };
  } catch (error) {
    return { attempts: [], error: error instanceof Error ? error.message : "数据库请求失败" };
  }
}

function AdminMessage({ title, detail, login = false }: { title: string; detail: string; login?: boolean }) {
  return (
    <main style={styles.main}>
      <section style={styles.panel}>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.muted}>{detail}</p>
        {login && <Link href="/api/admin/auth/signin?callbackUrl=/admin/reviews" style={styles.link}>使用 GitHub 登录</Link>}
      </section>
    </main>
  );
}

const styles = {
  main: { maxWidth: 1180, margin: "0 auto", padding: "48px 24px", fontFamily: "ui-sans-serif, system-ui", color: "#182230" },
  header: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24, marginBottom: 24 },
  eyebrow: { color: "#667085", fontSize: 13, margin: "0 0 8px" },
  title: { fontSize: 30, lineHeight: 1.2, margin: 0 },
  nav: { display: "flex", gap: 8, marginBottom: 20 },
  filter: { padding: "8px 12px", border: "1px solid #d0d5dd", borderRadius: 8, color: "#344054", textDecoration: "none" },
  activeFilter: { padding: "8px 12px", border: "1px solid #182230", borderRadius: 8, color: "white", background: "#182230", textDecoration: "none" },
  panel: { border: "1px solid #e4e7ec", borderRadius: 12, padding: 20, background: "white", overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  cell: { padding: "12px 10px", borderBottom: "1px solid #eaecf0", textAlign: "left" as const, whiteSpace: "nowrap" as const },
  link: { color: "#175cd3", textDecoration: "none" },
  muted: { color: "#667085", lineHeight: 1.6 }
};
