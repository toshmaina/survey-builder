import { getSurvey, getSurveys, subscribe } from "../state.js";
import { renderTable } from "../components/table.js";
import { openQuestionForm } from "../components/questionForm.js";
import { openDeleteQuestionDialog } from "../components/deleteQuestionDialog.js";
import { openPreviewDialog } from "../components/questionPreviewDialog.js";
import { renderNavControls } from "../components/navControls.js";
import { summarizeQuestion, getQuestionType } from "../questionTypes.js";
import { navigate } from "../router.js";

export function renderSurveyDetailsView(root, surveyId) {
  const survey = getSurvey(surveyId);

  if (!survey) {
    root.innerHTML = `<div class="empty-state"><strong>Survey not found</strong>It may have been deleted.</div>`;
    setTimeout(() => navigate("/surveys"), 1200);
    return () => {};
  }

  root.innerHTML = `
    <a class="detail-back" href="#/surveys">
      <img src="assets/icons/chevron-left.svg" alt="" width="14" height="14" /> All surveys
    </a>
    <div class="page-head">
      <div>
        <h1 id="survey-title"></h1>
        <p id="survey-description"></p>
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn btn--secondary" id="preview-btn">
          <img src="assets/icons/eye.svg" alt="" /> Preview
        </button>
        <button type="button" class="btn btn--primary" id="new-question-btn">
          <img src="assets/icons/plus.svg" alt="" /> Add question
        </button>
      </div>
    </div>
    <div id="question-table"></div>
    <div id="nav-controls"></div>
  `;

  const tableEl = root.querySelector("#question-table");
  const navEl = root.querySelector("#nav-controls");

  function draw() {
    const current = getSurvey(surveyId);
    if (!current) {
      navigate("/surveys");
      return;
    }

    root.querySelector("#survey-title").textContent = current.title;
    root.querySelector("#survey-description").textContent = current.description || "No description yet.";

    const sortedQuestions = [...current.questions].sort((a, b) => a.order - b.order);

    renderTable(tableEl, {
      columns: [
        { key: "label", label: "Question" },
        { key: "type", label: "Type" },
        { key: "config", label: "Configuration" },
        { key: "required", label: "Required" },
      ],
      rows: sortedQuestions,
      cellRenderers: {
        label: (row) => row.label,
        type: (row) => getQuestionType(row.type).label,
        config: (row) => summarizeQuestion(row),
        required: (row) => (row.required ? "Yes" : "No"),
      },
      rowActions: [
        { action: "edit", icon: "edit", label: "Edit question" },
        { action: "delete", icon: "trash", label: "Delete question" },
      ],
      onAction: (action, rowId) => {
        const question = getSurvey(surveyId).questions.find((q) => q.id === rowId);
        if (!question) return;
        if (action === "edit") openQuestionForm(surveyId, question);
        if (action === "delete") openDeleteQuestionDialog(surveyId, question);
      },
      emptyMessage: "Add your first question to build this survey.",
    });

    renderNavControls(navEl, { surveys: getSurveys(), currentId: surveyId });
  }

  root.querySelector("#new-question-btn").addEventListener("click", () => openQuestionForm(surveyId));
  root.querySelector("#preview-btn").addEventListener("click", () => openPreviewDialog(getSurvey(surveyId)));

  draw();
  const unsubscribe = subscribe(draw);
  return unsubscribe;
}
