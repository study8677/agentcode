"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type RubricItem = { id: string; label: string };
type FalsePositiveRule = { id: string; label: string };
type Result = "hit" | "partial" | "miss";

const resultOptions: Result[] = ["hit", "partial", "miss"];

export function AdjudicationForm({
  attemptId,
  rubricItems,
  falsePositiveRules
}: {
  attemptId: string;
  rubricItems: RubricItem[];
  falsePositiveRules: FalsePositiveRule[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const items = rubricItems.map((item) => ({
      rubricItemId: item.id,
      core: form.get(`${item.id}:core`) as Result,
      impact: form.get(`${item.id}:impact`) as Result,
      testQuality: form.get(`${item.id}:testQuality`) as Result,
      fixOrRationale: form.get(`${item.id}:fixOrRationale`) as Result
    }));
    const response = await fetch(`/api/admin/reviews/${attemptId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mergeDecision: form.get("mergeDecision"),
        items,
        falsePositives: falsePositiveRules.map((rule) => ({ ruleId: rule.id, confirmed: form.get(`fp:${rule.id}`) === "on" })),
        contradictionConfirmed: form.get("contradictionConfirmed") === "on",
        feedback: form.get("feedback"),
        overrideReason: form.get("overrideReason")
      })
    });
    const body = await response.json().catch(() => ({})) as { error?: string };

    if (!response.ok) {
      setMessage(body.error ?? "终审保存失败。");
      setSubmitting(false);
      return;
    }

    setMessage("终审已发布。");
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
      <ResultSelect name="mergeDecision" label="Merge decision" />
      {rubricItems.map((item) => (
        <fieldset key={item.id} style={{ border: "1px solid #d0d5dd", borderRadius: 10, padding: 16 }}>
          <legend style={{ padding: "0 8px", fontWeight: 650 }}>{item.label}</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <ResultSelect name={`${item.id}:core`} label="Core" />
            <ResultSelect name={`${item.id}:impact`} label="Impact" />
            <ResultSelect name={`${item.id}:testQuality`} label="Test quality" />
            <ResultSelect name={`${item.id}:fixOrRationale`} label="Fix / rationale" />
          </div>
        </fieldset>
      ))}
      {falsePositiveRules.length > 0 && (
        <fieldset style={{ border: "1px solid #d0d5dd", borderRadius: 10, padding: 16 }}>
          <legend style={{ padding: "0 8px", fontWeight: 650 }}>明确误报</legend>
          {falsePositiveRules.map((rule) => <label key={rule.id} style={{ display: "block", margin: "8px 0" }}><input type="checkbox" name={`fp:${rule.id}`} /> {rule.label}</label>)}
        </fieldset>
      )}
      <label><input type="checkbox" name="contradictionConfirmed" /> Merge 结论与 blocksMerge 自相矛盾</label>
      <label style={{ display: "grid", gap: 6 }}>给用户的最终反馈<textarea name="feedback" required rows={5} style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} /></label>
      <label style={{ display: "grid", gap: 6 }}>终审 / 覆盖理由（审计必填）<textarea name="overrideReason" required rows={3} style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} /></label>
      <button disabled={submitting} style={{ border: 0, borderRadius: 8, background: "#182230", color: "white", padding: "11px 16px", cursor: "pointer" }}>
        {submitting ? "发布中…" : "发布最终结果"}
      </button>
      {message && <p aria-live="polite">{message}</p>}
    </form>
  );
}

function ResultSelect({ name, label }: { name: string; label: string }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
      {label}
      <select name={name} defaultValue="miss" style={{ padding: 8, borderRadius: 8, border: "1px solid #d0d5dd" }}>
        {resultOptions.map((result) => <option key={result} value={result}>{result}</option>)}
      </select>
    </label>
  );
}
