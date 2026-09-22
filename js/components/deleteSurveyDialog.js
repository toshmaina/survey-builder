import { openDialog, closeDialog } from "./dialog.js";
import { deleteSurvey } from "../state.js";

export function openDeleteSurveyDialog(survey, { onDeleted } = {}) {
  const questionCount = survey.questions.length;

  const bodyHtml = `
    <p>Delete <strong>${survey.title}</strong>?</p>
    <p class="hint">${questionCount} question${questionCount === 1 ? "" : "s"} will be deleted with it. This can't be undone.</p>
  `;

  const footHtml = `
    <button type="button" class="btn btn--secondary" data-cancel>Cancel</button>
    <button type="button" class="btn btn--danger" data-confirm>Delete survey</button>
  `;

  openDialog({
    title: "Delete survey",
    bodyHtml,
    footHtml,
    onMount: (root) => {
      root.querySelector("[data-cancel]").addEventListener("click", closeDialog);
      root.querySelector("[data-confirm]").addEventListener("click", () => {
        deleteSurvey(survey.id);
        closeDialog();
        if (onDeleted) onDeleted();
      });
    },
  });
}
