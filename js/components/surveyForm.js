import { openDialog, closeDialog } from "./dialog.js";
import { createSurvey, updateSurvey } from "../state.js";

export function openSurveyForm(existingSurvey = null) {
  const isEdit = !!existingSurvey;

  const bodyHtml = `
    <form id="survey-form">
      <div class="field">
        <label for="survey-title">Title <span class="required-mark">*</span></label>
        <input type="text" id="survey-title" name="title" value="${existingSurvey?.title ?? ""}" required />
        <div class="form-error" id="title-error" hidden>Title is required.</div>
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
        const data = new FormData(form);
        const title = String(data.get("title") || "").trim();
        if (!title) {
          root.querySelector("#title-error").hidden = false;
          return;
        }
        const payload = {
          title,
          description: data.get("description"),
          status: data.get("status"),
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
