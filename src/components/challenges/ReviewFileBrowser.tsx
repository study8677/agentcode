"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ReviewChallengeFile } from "@/lib/challenges/review";
import type { ReviewLineFinding } from "@/lib/challenges/review-submission";

type DraftLineFinding = Omit<ReviewLineFinding, "id">;

type ReviewFileBrowserProps = {
  files: ReviewChallengeFile[];
  activeFileName: string;
  findings: ReviewLineFinding[];
  selectedFindingId: string | null;
  onActiveFileChange: (fileName: string) => void;
  onAddFinding: (finding: DraftLineFinding) => void;
  onUpdateFinding: (findingId: string, patch: Partial<ReviewLineFinding>) => void;
  onSelectFinding: (findingId: string | null) => void;
};

function getLineClass(file: ReviewChallengeFile, line: string, hasFinding: boolean, selected: boolean) {
  const classes = ["file-line"];

  if (file.language === "diff") {
    if (line.startsWith("@@")) {
      classes.push("hunk");
    } else if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff ") || line.startsWith("index ")) {
      classes.push("meta");
    } else if (line.startsWith("+")) {
      classes.push("addition");
    } else if (line.startsWith("-")) {
      classes.push("deletion");
    }
  }

  if (hasFinding) {
    classes.push("has-finding");
  }

  if (selected) {
    classes.push("selected");
  }

  return classes.join(" ");
}

function getFileCaption(file: ReviewChallengeFile) {
  if (file.name.endsWith(".diff")) {
    return "patch";
  }

  return file.language;
}

function createEmptyFinding(fileName: string, lineNumber: number): DraftLineFinding {
  return {
    fileName,
    lineNumber,
    severity: "high",
    problem: "",
    fix: ""
  };
}

function getDiffHunks(lines: string[]) {
  return lines.reduce<number[]>((hunks, line, index) => {
    if (line.startsWith("@@")) {
      hunks.push(index);
    }

    return hunks;
  }, []);
}

function getLineHunk(lineIndex: number, hunkStarts: number[]) {
  let current: number | null = null;

  for (const hunkStart of hunkStarts) {
    if (hunkStart > lineIndex) {
      break;
    }

    current = hunkStart;
  }

  return current;
}

export function ReviewFileBrowser({
  files,
  activeFileName,
  findings,
  selectedFindingId,
  onActiveFileChange,
  onAddFinding,
  onUpdateFinding,
  onSelectFinding
}: ReviewFileBrowserProps) {
  const activeFile = files.find((file) => file.name === activeFileName) ?? files[0];
  const lines = useMemo(() => activeFile?.content.split("\n") ?? [], [activeFile]);
  const hunkStarts = useMemo(() => getDiffHunks(lines), [lines]);
  const [openLine, setOpenLine] = useState<number | null>(null);
  const [draftFinding, setDraftFinding] = useState<DraftLineFinding | null>(null);
  const [collapsedHunks, setCollapsedHunks] = useState<Set<number>>(() => new Set());
  const lineRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const selectedFinding = findings.find((finding) => finding.id === selectedFindingId) ?? null;

  useEffect(() => {
    if (!selectedFinding || selectedFinding.fileName !== activeFile?.name) {
      return;
    }

    const key = `${selectedFinding.fileName}:${selectedFinding.lineNumber}`;
    lineRefs.current[key]?.scrollIntoView({ block: "center" });
  }, [activeFile?.name, selectedFinding]);

  if (!activeFile) {
    return null;
  }

  function changeActiveFile(fileName: string) {
    setOpenLine(null);
    setDraftFinding(null);
    setCollapsedHunks(new Set());
    onActiveFileChange(fileName);
  }

  function selectLine(lineNumber: number) {
    const existing = findings.find((finding) => finding.fileName === activeFile.name && finding.lineNumber === lineNumber);

    if (existing) {
      onSelectFinding(existing.id);
      setOpenLine(lineNumber);
      return;
    }

    setOpenLine(lineNumber);
    setDraftFinding(createEmptyFinding(activeFile.name, lineNumber));
    onSelectFinding(null);
  }

  function saveDraftFinding() {
    if (!draftFinding || !draftFinding.problem.trim()) {
      return;
    }

    onAddFinding(draftFinding);
    setOpenLine(null);
    setDraftFinding(null);
  }

  function toggleHunk(hunkIndex: number) {
    setCollapsedHunks((current) => {
      const next = new Set(current);

      if (next.has(hunkIndex)) {
        next.delete(hunkIndex);
      } else {
        next.add(hunkIndex);
      }

      return next;
    });
  }

  return (
    <section className="review-code-pane" id="files">
      <div className="file-tabs" aria-label="题目文件列表" role="tablist">
        {files.map((file) => (
          <button
            aria-selected={file.name === activeFile.name}
            className={file.name === activeFile.name ? "file-tab active" : "file-tab"}
            key={file.name}
            onClick={() => changeActiveFile(file.name)}
            role="tab"
            type="button"
          >
            <span>{file.label}</span>
            <small>{getFileCaption(file)}</small>
          </button>
        ))}
      </div>

      <div className="file-viewer" role="tabpanel">
        <div className="file-toolbar">
          <strong>{activeFile.name}</strong>
          <span>
            {activeFile.language} · {lines.length} lines
          </span>
        </div>
        <pre className={`file-code file-code-${activeFile.language}`}>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const hunkIndex = getLineHunk(index, hunkStarts);
            const isHunkHeader = activeFile.language === "diff" && line.startsWith("@@");
            const hiddenByHunk = hunkIndex !== null && collapsedHunks.has(hunkIndex) && !isHunkHeader;
            const lineFindings = findings.filter((finding) => finding.fileName === activeFile.name && finding.lineNumber === lineNumber);
            const selected = lineFindings.some((finding) => finding.id === selectedFindingId);

            if (hiddenByHunk) {
              return null;
            }

            return (
              <span
                className={getLineClass(activeFile, line, lineFindings.length > 0, selected)}
                key={`${activeFile.name}-${index}`}
                ref={(element) => {
                  lineRefs.current[`${activeFile.name}:${lineNumber}`] = element;
                }}
              >
                <button
                  className="line-number"
                  onClick={() => {
                    if (isHunkHeader) {
                      toggleHunk(index);
                    } else {
                      selectLine(lineNumber);
                    }
                  }}
                  title={isHunkHeader ? "折叠/展开 hunk" : "添加 finding"}
                  type="button"
                >
                  {isHunkHeader ? (collapsedHunks.has(index) ? "+" : "-") : lineNumber}
                </button>
                <span className="line-content">{line || " "}</span>
                {lineFindings.length > 0 ? (
                  <span className="line-finding-marker" aria-label="该行已有 finding">
                    {lineFindings.length}
                  </span>
                ) : null}

                {openLine === lineNumber ? (
                  <span className="inline-finding-card">
                    {lineFindings.length > 0 ? (
                      lineFindings.map((finding) => (
                        <span className="inline-existing-finding" key={finding.id}>
                          <span>
                            <strong>{finding.severity}</strong> {finding.problem}
                          </span>
                          <textarea
                            aria-label="修复建议"
                            onChange={(event) => onUpdateFinding(finding.id, { fix: event.target.value })}
                            rows={2}
                            value={finding.fix}
                          />
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="inline-finding-row">
                          <select
                            aria-label="严重程度"
                            onChange={(event) => setDraftFinding((current) => current ? { ...current, severity: event.target.value } : current)}
                            value={draftFinding?.severity ?? "high"}
                          >
                            <option value="blocking">blocking</option>
                            <option value="high">high</option>
                            <option value="medium">medium</option>
                            <option value="low">low</option>
                            <option value="check">check</option>
                          </select>
                          <span className="mono">{activeFile.name}:{lineNumber}</span>
                        </span>
                        <textarea
                          aria-label="问题描述"
                          onChange={(event) => setDraftFinding((current) => current ? { ...current, problem: event.target.value } : current)}
                          placeholder="问题描述"
                          rows={2}
                          value={draftFinding?.problem ?? ""}
                        />
                        <textarea
                          aria-label="修复建议"
                          onChange={(event) => setDraftFinding((current) => current ? { ...current, fix: event.target.value } : current)}
                          placeholder="修复建议"
                          rows={2}
                          value={draftFinding?.fix ?? ""}
                        />
                        <span className="inline-finding-actions">
                          <button className="button button-primary" onClick={saveDraftFinding} type="button">
                            添加 finding
                          </button>
                          <button className="button button-ghost" onClick={() => setOpenLine(null)} type="button">
                            取消
                          </button>
                        </span>
                      </>
                    )}
                  </span>
                ) : null}
              </span>
            );
          })}
        </pre>
      </div>
    </section>
  );
}
