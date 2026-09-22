import { openDialog, closeDialog } from "./dialog.js";
import { createQuestion, updateQuestion } from "../state.js";
import { QUESTION_TYPES, renderExtraFieldsHtml, bindExtraFieldEvents, collectExtraFields } from "../questionTypes.js";

export function openQuestionForm(surveyId, existingQuestion = null) {
  const isEdit = !!existingQuestion;
  const currentType = existingQuestion?.type || QUESTION_TYPES[0].id;

  const bodyHtml = `
    <form id="question-form">
      <div class="field">
        <label for="q-label">Question label <span class="required-mark">*</span></label>
        <input type="text" id="q-label" name="label" value="${existingQuestion?.label ?? ""}" required />
        <div class="form-error" id="label-error" hidden>A question label is required.</div>
      </div>
      <div class="field">
        <label for="q-help">Help text</label>
        <input type="text" id="q-help" name="helpText" value="${existingQuestion?.helpText ?? ""}" placeholder="Optional guidance shown under the question" />
      </div>
      <div class="field">
        <label for="q-type">Question type</label>
        <select id="q-type" name="type">
          ${QUESTION_TYPES.map((t) => `<option value="${t.id}" ${t.id === currentType ? "selected" : ""}>${t.label}</option>`).join("")}
        </select>
      </div>
      <div id="extra-fields">${renderExtraFieldsHtml(currentType, existingQuestion || {})}</div>
      <div class="field checkbox-row">
        <input type="checkbox" id="q-required" name="required" ${existingQuestion?.required ? "checked" : ""} />
        <label for="q-required" style="margin:0;">Required</label>
      </div>
    </form>
  `;

  const footHtml = `
    <button type="button" class="btn btn--secondary" data-cancel>Cancel</button>
    <button type="submit" form="question-form" class="btn btn--primary">${isEdit ? "Save changes" : "Add question"}</button>
  `;

  openDialog({
    title: isEdit ? "Edit question" : "New question",
    bodyHtml,
    footHtml,
    onMount: (root) => {
      root.querySelector("[data-cancel]").addEventListener("click", closeDialog);

      const extraContainer = root.querySelector("#extra-fields");
      bindExtraFieldEvents(extraContainer, currentType, existingQuestion || {});

      const typeSelect = root.querySelector("#q-type");
      typeSelect.addEventListener("change", () => {
        const newType = typeSelect.value;
        extraContainer.innerHTML = renderExtraFieldsHtml(newType, {});
        bindExtraFieldEvents(extraContainer, newType, {});
      });

      const form = root.querySelector("#question-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const label = String(data.get("label") || "").trim();
        if (!label) {
          root.querySelector("#label-error").hidden = false;
          return;
        }
        const type = data.get("type");
        const payload = {
          label,
          helpText: data.get("helpText") || "",
          type,
          required: data.get("required") === "on",
          ...collectExtraFields(data, type),
        };
        if (isEdit) {
          updateQuestion(surveyId, existingQuestion.id, payload);
        } else {
          createQuestion(surveyId, payload);
        }
        closeDialog();
      });
    },
  });
}
