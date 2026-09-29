import { openDialog, closeDialog } from "./dialog.js";
import { renderPreviewInput } from "../questionTypes.js";

const LAYOUT_OPTIONS = [
  { cols: 1, label: "Single column", icon: "single-column" },
  { cols: 2, label: "Two columns", icon: "two-column" },
  { cols: 3, label: "Three columns", icon: "three-column" },
];

export function openPreviewDialog(survey) {
  const sorted = [...survey.questions].sort((a, b) => a.order - b.order);
  // The survey's saved "Layout Columns" preference decides how the preview opens.
  const preferredCols = survey.preferences?.layoutColumns ?? 1;

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
      ${LAYOUT_OPTIONS.map(
        (o) => `
      <button type="button" class="layout-toggle-btn ${o.cols === preferredCols ? "is-active" : ""}" data-columns="${o.cols}" aria-label="${o.label}" aria-pressed="${o.cols === preferredCols}">
        <img src="assets/icons/${o.icon}.svg" alt="" />
      </button>`
      ).join("")}
    </div>
  `
    : "";

  const bodyHtml = `
    ${layoutToggleHtml}
    <div class="preview-questions" id="preview-questions" data-columns="${preferredCols}">${questionsHtml}</div>
  `;

  openDialog({
    title: `Preview — ${survey.title}`,
    bodyHtml,
    footHtml: `<button type="button" class="btn btn--secondary" data-cancel>Close</button>`,
    dialogClass: "dialog--preview",
    onMount: (root) => {
      root.querySelector("[data-cancel]").addEventListener("click", closeDialog);

      const toggleButtons = root.querySelectorAll(".layout-toggle-btn");
      const questionsEl = root.querySelector("#preview-questions");

      toggleButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          toggleButtons.forEach((b) => {
            const active = b === btn;
            b.classList.toggle("is-active", active);
            b.setAttribute("aria-pressed", String(active));
          });
          questionsEl.dataset.columns = btn.dataset.columns;
        });
      });
    },
  });
}
