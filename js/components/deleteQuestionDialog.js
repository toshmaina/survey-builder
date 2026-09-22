import { openDialog, closeDialog } from "./dialog.js";
import { deleteQuestion } from "../state.js";

export function openDeleteQuestionDialog(surveyId, question) {
  const bodyHtml = `<p>Delete the question <strong>${question.label}</strong>? This can't be undone.</p>`;
  const footHtml = `
    <button type="button" class="btn btn--secondary" data-cancel>Cancel</button>
    <button type="button" class="btn btn--danger" data-confirm>Delete question</button>
  `;

  openDialog({
    title: "Delete question",
    bodyHtml,
    footHtml,
    onMount: (root) => {
      root.querySelector("[data-cancel]").addEventListener("click", closeDialog);
      root.querySelector("[data-confirm]").addEventListener("click", () => {
        deleteQuestion(surveyId, question.id);
        closeDialog();
      });
    },
  });
}
