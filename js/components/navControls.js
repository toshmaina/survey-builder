import { navigate } from "../router.js";

export function renderNavControls(container, { surveys, currentId }) {
  const index = surveys.findIndex((s) => s.id === currentId);
  const prev = index > 0 ? surveys[index - 1] : null;
  const next = index < surveys.length - 1 ? surveys[index + 1] : null;

  container.innerHTML = `
    <div class="nav-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">
      <button type="button" class="btn btn--outline" ${prev ? "" : "disabled"} data-nav="prev">
        <img src="assets/icons/chevron-left.svg" alt="chevron left" /> Previous Survey
      </button>

      <span class="nav-controls__position" style="font-size: var(--fs-base); font-weight: 600; color: var(--color-text);">
        Survey ${index + 1} of ${surveys.length}
      </span>

      <button type="button" class="btn btn--outline" ${next ? "" : "disabled"} data-nav="next">
        Next Survey <img src="assets/icons/chevron-right.svg" alt="chevron right" />
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
