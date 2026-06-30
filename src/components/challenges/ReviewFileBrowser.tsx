"use client";

import { useMemo, useState } from "react";

import type { ReviewChallengeFile } from "@/lib/challenges/review";

type ReviewFileBrowserProps = {
  files: ReviewChallengeFile[];
  defaultFileName: string;
};

function getLineClass(file: ReviewChallengeFile, line: string) {
  if (file.language !== "diff") {
    return "file-line";
  }

  if (line.startsWith("@@")) {
    return "file-line hunk";
  }

  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff ") || line.startsWith("index ")) {
    return "file-line meta";
  }

  if (line.startsWith("+")) {
    return "file-line addition";
  }

  if (line.startsWith("-")) {
    return "file-line deletion";
  }

  return "file-line";
}

function getFileCaption(file: ReviewChallengeFile) {
  if (file.name.endsWith(".diff")) {
    return "AI PR patch";
  }

  if (file.name === "README.zh.md") {
    return "中文题面";
  }

  if (file.name === "README.en.md") {
    return "English brief";
  }

  return file.language;
}

export function ReviewFileBrowser({ files, defaultFileName }: ReviewFileBrowserProps) {
  const initialFileName = files.some((file) => file.name === defaultFileName) ? defaultFileName : files[0]?.name;
  const [activeFileName, setActiveFileName] = useState(initialFileName ?? "");
  const activeFile = files.find((file) => file.name === activeFileName) ?? files[0];
  const lines = useMemo(() => activeFile?.content.split("\n") ?? [], [activeFile]);

  if (!activeFile) {
    return null;
  }

  return (
    <section className="challenge-section card file-browser" id="files">
      <div className="card-head">
        <h2>题目文件</h2>
        <span className="mono">{activeFile.name}</span>
      </div>

      <div className="file-browser-body">
        <div aria-label="题目文件列表" className="file-list" role="tablist">
          {files.map((file) => (
            <button
              aria-selected={file.name === activeFile.name}
              className={file.name === activeFile.name ? "file-tab active" : "file-tab"}
              key={file.name}
              onClick={() => setActiveFileName(file.name)}
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
            {lines.map((line, index) => (
              <span className={getLineClass(activeFile, line)} key={`${activeFile.name}-${index}`}>
                <span className="line-number">{index + 1}</span>
                <span className="line-content">{line || " "}</span>
              </span>
            ))}
          </pre>
        </div>
      </div>

      <div className="file-note">
        当前只展示学习者需要审阅的题目文件；参考答案文件不会在提交前显示。
      </div>
    </section>
  );
}
