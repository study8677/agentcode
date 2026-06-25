import type { Challenge, PracticeStats } from "@/lib/types/problem";

export const practiceStats: PracticeStats = {
  seedChallenges: 20,
  taskMode: 10,
  reviewMode: 10,
  taskProgress: 3,
  reviewProgress: 2
};

export const challenges: Challenge[] = [
  {
    id: "001",
    title: {
      zh: "修复分页边界问题",
      en: "Fix pagination boundaries"
    },
    summary: {
      zh: "修复 page=0、空结果和 cursor 边界，并补充测试。",
      en: "Fix page=0, empty results, and cursor boundaries, then add tests."
    },
    mode: "task",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 41.2,
    tags: ["backend", "tests", "edge-case"],
    runStatus: "idle"
  },
  {
    id: "002",
    title: {
      zh: "PR 删除了权限校验",
      en: "PR removed permission checks"
    },
    summary: {
      zh: "识别看似通过测试的 PR 是否引入越权风险。",
      en: "Detect whether a PR that passes tests introduced an authorization risk."
    },
    mode: "review",
    difficulty: "senior",
    status: "needs-review",
    acceptanceRate: 28.5,
    tags: ["security", "review", "auth"],
    runStatus: "failed"
  },
  {
    id: "003",
    title: {
      zh: "阻止异步任务重复执行",
      en: "Prevent duplicate async jobs"
    },
    summary: {
      zh: "定位队列重复消费、锁粒度和幂等性问题。",
      en: "Find duplicate queue execution, lock granularity, and idempotency issues."
    },
    mode: "task",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 22.9,
    tags: ["queue", "idempotency", "concurrency"],
    runStatus: "queued"
  },
  {
    id: "004",
    title: {
      zh: "测试很多但没测核心风险",
      en: "Many tests, core risk missed"
    },
    summary: {
      zh: "判断测试数量和测试质量之间的差异。",
      en: "Judge the difference between test count and test quality."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 36.8,
    tags: ["test-quality", "review"],
    runStatus: "success"
  },
  {
    id: "005",
    title: {
      zh: "实现基础 Rate Limit",
      en: "Implement basic rate limit"
    },
    summary: {
      zh: "在不破坏兼容性的情况下增加参数和频率校验。",
      en: "Add parameter and frequency checks without breaking compatibility."
    },
    mode: "task",
    difficulty: "mid",
    status: "draft",
    acceptanceRate: 47,
    tags: ["api", "validation", "compatibility"],
    runStatus: "idle"
  }
];
