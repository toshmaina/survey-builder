import { openDialog, closeDialog } from "./dialog.js";
import { renderPreviewInput } from "../questionTypes.js";

export function openPreviewDialog(survey) {
  const sorted = [...survey.questions].sort((a, b) => a.order - b.order);

  const questionsHtml = sorted.length
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

  const layoutToggleHtml = sorted.length
    ? `
    <div class="preview-layout-toggle" role="group" aria-label="Preview layout">
      <button type="button" class="layout-toggle-btn is-active" data-columns="1" aria-label="Single column">
        <img src="assets/icons/single-column.svg" alt="single column" />
      </button>
      <button type="button" class="layout-toggle-btn" data-columns="2" aria-label="Two columns">
        <img src="assets/icons/two-column.svg" alt="two columns" />
      </button>
    </div>
  `
    : "";

  const bodyHtml = `
    ${layoutToggleHtml}
    <div class="preview-questions" id="preview-questions">${questionsHtml}</div>
  `;

  openDialog({
    title: `Preview — ${survey.title}`,
    bodyHtml,
    footHtml: `<button type="button" class="btn btn--secondary" data-cancel>Close</button>`,
    onMount: (root) => {
      root.querySelector("[data-cancel]").addEventListener("click", closeDialog);

      const toggleButtons = root.querySelectorAll(".layout-toggle-btn");
      const questionsEl = root.querySelector("#preview-questions");

      toggleButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const columns = btn.dataset.columns;
          toggleButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
          questionsEl.classList.toggle("preview-questions--two-col", columns === "2");
          root.classList.toggle("dialog--wide", columns === "2");
        });
      });
    },
  });
}
