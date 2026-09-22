// Central registry: every supported question type, how to edit it in the
// question form, and how to render it in the end-user preview.
// The survey builder form, the question table, and the preview dialog all
// read from this one list instead of hard-coding per-type logic.

export const QUESTION_TYPES = [
  { id: "short_text", label: "Short text" },
  { id: "long_text", label: "Long text" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone number" },
  { id: "url", label: "Website / link" },
  { id: "search", label: "Search-style answer" },
  { id: "password", label: "Sensitive / masked text" },
  { id: "number", label: "Number" },
  { id: "date", label: "Date" },
  { id: "time", label: "Time" },
  { id: "datetime", label: "Date & time" },
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "single_choice", label: "Single choice (radio)" },
  { id: "multi_choice", label: "Multiple choice (checkboxes)" },
  { id: "dropdown_single", label: "Dropdown (single select)" },
  { id: "dropdown_multi", label: "Dropdown (multi select)" },
  { id: "boolean", label: "Yes / No" },
  { id: "rating", label: "Rating (slider)" },
  { id: "opinion_scale", label: "Opinion scale (1–10)" },
  { id: "file_upload", label: "File upload" },
  { id: "color", label: "Color preference" },
];

const CHOICE_TYPES = new Set(["single_choice", "multi_choice", "dropdown_single", "dropdown_multi"]);
const RANGE_TYPES = new Set(["number", "rating", "opinion_scale"]);

export function getQuestionType(id) {
  return QUESTION_TYPES.find((t) => t.id === id) || QUESTION_TYPES[0];
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Extra, type-specific fields shown inside the question add/edit form. */
export function renderExtraFieldsHtml(typeId, question = {}) {
  if (CHOICE_TYPES.has(typeId)) {
    const options = question.options && question.options.length ? question.options : ["Option 1", "Option 2"];
    return `
      <div class="field" data-extra-field="options">
        <label>Options</label>
        <div class="option-list" id="option-list"></div>
        <button type="button" class="btn btn--secondary" id="add-option-btn" style="margin-top:8px;">
          <img src="assets/icons/plus.svg" alt="" width="14" height="14" /> Add option
        </button>
        <input type="hidden" name="options" id="options-hidden" value='${escapeHtml(JSON.stringify(options))}' />
      </div>
    `;
  }
  if (RANGE_TYPES.has(typeId)) {
    const min = question.min ?? (typeId === "opinion_scale" ? 1 : 0);
    const max = question.max ?? (typeId === "opinion_scale" ? 10 : typeId === "rating" ? 5 : 100);
    const step = question.step ?? 1;
    return `
      <div class="field" style="display:flex; gap:12px;">
        <div style="flex:1;">
          <label>Min</label>
          <input type="number" name="min" value="${min}" />
        </div>
        <div style="flex:1;">
          <label>Max</label>
          <input type="number" name="max" value="${max}" />
        </div>
        <div style="flex:1;">
          <label>Step</label>
          <input type="number" name="step" value="${step}" min="0.01" />
        </div>
      </div>
    `;
  }
  if (typeId === "file_upload") {
    return `
      <div class="field">
        <label>Accepted file types</label>
        <input type="text" name="accept" value="${escapeHtml(question.accept || "")}" placeholder=".pdf,.png,.jpg" />
        <p class="hint">Comma-separated extensions or MIME types. Leave blank to accept anything.</p>
      </div>
    `;
  }
  return "";
}

/** Wires up dynamic bits (option add/remove rows) after renderExtraFieldsHtml is in the DOM. */
export function bindExtraFieldEvents(container, typeId, question = {}) {
  if (!CHOICE_TYPES.has(typeId)) return;
  const listEl = container.querySelector("#option-list");
  const hiddenEl = container.querySelector("#options-hidden");
  const addBtn = container.querySelector("#add-option-btn");
  if (!listEl || !hiddenEl) return;

  let options = question.options && question.options.length ? [...question.options] : ["Option 1", "Option 2"];

  function sync() {
    hiddenEl.value = JSON.stringify(options.filter((o) => o.trim() !== ""));
  }

  function draw() {
    listEl.innerHTML = options
      .map(
        (opt, i) => `
        <div class="option-list__row" data-index="${i}">
          <input type="text" value="${escapeHtml(opt)}" data-option-input />
          <button type="button" class="btn btn--icon" data-remove-option aria-label="Remove option">
            <img src="assets/icons/trash.svg" alt="" />
          </button>
        </div>`
      )
      .join("");
    sync();
  }

  listEl.addEventListener("input", (e) => {
    const row = e.target.closest("[data-index]");
    if (!row || !e.target.matches("[data-option-input]")) return;
    options[Number(row.dataset.index)] = e.target.value;
    sync();
  });

  listEl.addEventListener("click", (e) => {
    const row = e.target.closest("[data-index]");
    if (!row || !e.target.closest("[data-remove-option]")) return;
    options.splice(Number(row.dataset.index), 1);
    draw();
  });

  addBtn.addEventListener("click", () => {
    options.push(`Option ${options.length + 1}`);
    draw();
  });

  draw();
}

/** Reads the type-specific fields back out of the submitted form. */
export function collectExtraFields(formData, typeId) {
  if (CHOICE_TYPES.has(typeId)) {
    let options = [];
    try {
      options = JSON.parse(formData.get("options") || "[]");
    } catch {
      options = [];
    }
    return { options: options.filter((o) => o && o.trim() !== "") };
  }
  if (RANGE_TYPES.has(typeId)) {
    return {
      min: Number(formData.get("min")),
      max: Number(formData.get("max")),
      step: Number(formData.get("step")) || 1,
    };
  }
  if (typeId === "file_upload") {
    return { accept: formData.get("accept") || "" };
  }
  return {};
}

/** Renders the read-only end-user preview input for a question. */
export function renderPreviewInput(question) {
  const name = `q_${question.id}`;
  const opts = question.options || [];
  switch (question.type) {
    case "short_text":
      return `<input type="text" name="${name}" placeholder="Your answer" disabled />`;
    case "long_text":
      return `<textarea name="${name}" placeholder="Your answer" disabled></textarea>`;
    case "email":
      return `<input type="email" name="${name}" placeholder="you@example.com" disabled />`;
    case "phone":
      return `<input type="tel" name="${name}" placeholder="+254 7xx xxx xxx" disabled />`;
    case "url":
      return `<input type="url" name="${name}" placeholder="https://" disabled />`;
    case "search":
      return `<input type="search" name="${name}" placeholder="Search..." disabled />`;
    case "password":
      return `<input type="password" name="${name}" placeholder="••••••" disabled />`;
    case "number":
      return `<input type="number" name="${name}" min="${question.min}" max="${question.max}" step="${question.step}" disabled />`;
    case "date":
      return `<input type="date" name="${name}" disabled />`;
    case "time":
      return `<input type="time" name="${name}" disabled />`;
    case "datetime":
      return `<input type="datetime-local" name="${name}" disabled />`;
    case "month":
      return `<input type="month" name="${name}" disabled />`;
    case "week":
      return `<input type="week" name="${name}" disabled />`;
    case "single_choice":
      return opts
        .map(
          (o, i) => `
        <div class="radio-row">
          <input type="radio" name="${name}" id="${name}_${i}" disabled />
          <label for="${name}_${i}">${escapeHtml(o)}</label>
        </div>`
        )
        .join("");
    case "multi_choice":
      return opts
        .map(
          (o, i) => `
        <div class="checkbox-row">
          <input type="checkbox" name="${name}" id="${name}_${i}" disabled />
          <label for="${name}_${i}">${escapeHtml(o)}</label>
        </div>`
        )
        .join("");
    case "dropdown_single":
      return `<select name="${name}" disabled><option>Select...</option>${opts
        .map((o) => `<option>${escapeHtml(o)}</option>`)
        .join("")}</select>`;
    case "dropdown_multi":
      return `<select name="${name}" multiple disabled>${opts
        .map((o) => `<option>${escapeHtml(o)}</option>`)
        .join("")}</select>`;
    case "boolean":
      return `
        <div class="radio-row"><input type="radio" name="${name}" id="${name}_yes" disabled /><label for="${name}_yes">Yes</label></div>
        <div class="radio-row"><input type="radio" name="${name}" id="${name}_no" disabled /><label for="${name}_no">No</label></div>
      `;
    case "rating":
      return `<input type="range" name="${name}" min="${question.min}" max="${question.max}" step="${question.step}" disabled />
        <div class="hint">${question.min} – ${question.max}</div>`;
    case "opinion_scale":
      return `<input type="range" name="${name}" min="${question.min}" max="${question.max}" step="${question.step}" disabled />
        <div class="hint">${question.min} (low) – ${question.max} (high)</div>`;
    case "file_upload":
      return `<input type="file" name="${name}" ${question.accept ? `accept="${escapeHtml(question.accept)}"` : ""} disabled />`;
    case "color":
      return `<input type="color" name="${name}" value="#2f5d50" disabled />`;
    default:
      return `<input type="text" name="${name}" disabled />`;
  }
}

/** One-line summary of a question's config, for the questions table. */
export function summarizeQuestion(question) {
  if (CHOICE_TYPES.has(question.type)) {
    return `${(question.options || []).length} option(s)`;
  }
  if (RANGE_TYPES.has(question.type)) {
    return `${question.min}–${question.max} (step ${question.step})`;
  }
  if (question.type === "file_upload") {
    return question.accept ? question.accept : "Any file type";
  }
  return getQuestionType(question.type).label;
}
