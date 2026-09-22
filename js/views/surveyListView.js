import { getSurveys, subscribe } from "../state.js";
import { renderTable } from "../components/table.js";
import { openSurveyForm } from "../components/surveyForm.js";
import { openDeleteSurveyDialog } from "../components/deleteSurveyDialog.js";
import { navigate } from "../router.js";

export function renderSurveyListView(root) {
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Surveys</h1>
        <p>Create, edit, and manage every survey from here.</p>
      </div>
      <button type="button" class="btn btn--primary btn--stacked" id="new-survey-btn">
        <img src="assets/icons/plus.svg" alt="" />
        <span>New survey</span>
      </button>
    </div>
    <div id="survey-table"></div>
  `;

  const tableEl = root.querySelector("#survey-table");

  function draw() {
    const surveys = getSurveys();
    renderTable(tableEl, {
      columns: [
        { key: "title", label: "Title" },
        { key: "status", label: "Status" },
        { key: "questions", label: "Questions" },
        { key: "updatedAt", label: "Updated" },
      ],
      rows: surveys,
      cellRenderers: {
        title: (row) => `<a href="#/surveys/${row.id}" style="color:inherit;font-weight:500;">${row.title}</a>`,
        status: (row) => `<span class="status-pill ${row.status === "closed" ? "status-pill--closed" : ""}">${row.status}</span>`,
        questions: (row) => `${row.questions.length}`,
        updatedAt: (row) => new Date(row.updatedAt).toLocaleDateString(),
      },
      rowActions: [
        { action: "edit", icon: "edit", label: "Edit survey" },
        { action: "delete", icon: "trash", label: "Delete survey" },
      ],
      onAction: (action, rowId) => {
        const survey = getSurveys().find((s) => s.id === rowId);
        if (!survey) return;
        if (action === "edit") openSurveyForm(survey);
        if (action === "delete") openDeleteSurveyDialog(survey);
      },
      emptyMessage: "Create your first survey to get started.",
    });
  }

  root.querySelector("#new-survey-btn").addEventListener("click", () => openSurveyForm());

  draw();
  const unsubscribe = subscribe(draw);
  return unsubscribe;
}
