import { navigate } from "../router.js";

export function renderNavControls(container, { surveys, currentId }) {
  const index = surveys.findIndex((s) => s.id === currentId);
  const prev = index > 0 ? surveys[index - 1] : null;
  const next = index < surveys.length - 1 ? surveys[index + 1] : null;

  container.innerHTML = `
    <div class="nav-controls">
      <button type="button" class="btn btn--secondary" ${prev ? "" : "disabled"} data-nav="prev">
        <img src="assets/icons/chevron-left.svg" alt="" /> Previous
      </button>
      <span class="nav-controls__position">Survey ${index + 1} of ${surveys.length}</span>
      <button type="button" class="btn btn--secondary" ${next ? "" : "disabled"} data-nav="next">
        Next <img src="assets/icons/chevron-right.svg" alt="" />
      </button>
    </div>
  `;

  if (prev) {
    container.querySelector('[data-nav="prev"]').addEventListener("click", () => navigate(`/surveys/${prev.id}`));
  }
  if (next) {
    container.querySelector('[data-nav="next"]').addEventListener("click", () => navigate(`/surveys/${next.id}`));
  }
}
