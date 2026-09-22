import { openDialog, closeDialog } from "./dialog.js";
import { renderPreviewInput } from "../questionTypes.js";

export function openPreviewDialog(survey) {
  const sorted = [...survey.questions].sort((a, b) => a.order - b.order);

  const bodyHtml = sorted.length
    ? sorted
        .map(
          (q) => `
      <div class="preview-question">
        <div class="preview-question__label">${q.label}${q.required ? '<span class="required-mark">*</span>' : ""}</div>
        ${renderPreviewInput(q)}
        ${q.helpText ? `<div class="preview-question__help">${q.helpText}</div>` : ""}
      </div>
    `
        )
        .join("")
    : `<div class="empty-state"><strong>No questions to preview yet</strong>Add a question first.</div>`;

  openDialog({
    title: `Preview — ${survey.title}`,
    bodyHtml,
    footHtml: `<button type="button" class="btn btn--secondary" data-cancel>Close</button>`,
    onMount: (root) => {
      root.querySelector("[data-cancel]").addEventListener("click", closeDialog);
    },
  });
}
