import { openDialog, closeDialog } from "./dialog.js";
import { createSurvey, updateSurvey } from "../state.js";

export function openSurveyForm(existingSurvey = null) {
  const isEdit = !!existingSurvey;
  const layoutColumns = existingSurvey?.preferences?.layoutColumns ?? 1;

  const bodyHtml = `
    <form id="survey-form">
      <div class="field field--validated">
        <label for="survey-title">Title <span class="required-mark">*</span></label>
        <div class="input-with-icon">
          <input type="text" id="survey-title" name="title" value="${existingSurvey?.title ?? ""}" required pattern=".*\\S.*" />
          <img class="input-icon" src="../../assets/icons/exclamation.png" alt="exclamation mark icon" aria-hidden="true" />
        </div>
        <p class="field-error-text">Title is required!</p>
      </div>
      <div class="field">
        <label for="survey-description">Description</label>
        <textarea id="survey-description" name="description">${existingSurvey?.description ?? ""}</textarea>
      </div>
      <div class="field">
        <label for="survey-status">Status</label>
        <select id="survey-status" name="status">
          <option value="draft" ${existingSurvey?.status === "draft" || !existingSurvey ? "selected" : ""}>Draft</option>
          <option value="published" ${existingSurvey?.status === "published" ? "selected" : ""}>Published</option>
          <option value="closed" ${existingSurvey?.status === "closed" ? "selected" : ""}>Closed</option>
        </select>
      </div>

      <div class="form-section">
        <h3 class="form-section__title">Preferences</h3>
        <div class="field">
          <label for="survey-layout-columns">Layout Columns</label>
          <select id="survey-layout-columns" name="layoutColumns">
            ${[1, 2, 3]
              .map((n) => `<option value="${n}" ${n === layoutColumns ? "selected" : ""}>${n} col</option>`)
              .join("")}
          </select>
          <p class="hint">How the questions are laid out in the preview.</p>
        </div>
      </div>
    </form>
  `;

  const footHtml = `
    <button type="button" class="btn btn--secondary" data-cancel>Cancel</button>
    <button type="submit" form="survey-form" class="btn btn--primary">${isEdit ? "Save changes" : "Create survey"}</button>
  `;

  openDialog({
    title: isEdit ? "Edit survey" : "New survey",
    bodyHtml,
    footHtml,
    onMount: (root) => {
      root.querySelector("[data-cancel]").addEventListener("click", closeDialog);
      const form = root.querySelector("#survey-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        // Red border / message come from CSS (:user-invalid) — this only stops the save.
        if (!form.checkValidity()) return;
        const data = new FormData(form);
        const title = String(data.get("title") || "").trim();
        if (!title) return;
        const payload = {
          title,
          description: data.get("description"),
          status: data.get("status"),
          layoutColumns: Number(data.get("layoutColumns")),
        };
        if (isEdit) {
          updateSurvey(existingSurvey.id, payload);
        } else {
          createSurvey(payload);
        }
        closeDialog();
      });
    },
  });
}
