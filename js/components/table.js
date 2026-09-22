/**
 * Renders a table into a container element.
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {{key:string,label:string}[]} opts.columns
 * @param {Object[]} opts.rows - each row must have an `id`
 * @param {(row:Object)=>string} opts.renderCell - given row and implicitly current column via closure; see usage
 * @param {{icon:string,label:string,action:string}[]} opts.rowActions
 * @param {(action:string,rowId:string)=>void} opts.onAction
 * @param {string} [opts.emptyMessage]
 */
export function renderTable(container, { columns, rows, cellRenderers, rowActions, onAction, emptyMessage }) {
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state"><strong>Nothing here yet</strong>${emptyMessage || ""}</div>`;
    return;
  }

  const head = columns.map((c) => `<th>${c.label}</th>`).join("") + (rowActions ? "<th></th>" : "");

  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => `<td>${cellRenderers[c.key] ? cellRenderers[c.key](row) : row[c.key] ?? ""}</td>`)
        .join("");
      const actions = rowActions
        ? `<td class="data-table__actions">${rowActions
            .map(
              (a) =>
                `<button type="button" class="btn btn--icon" data-action="${a.action}" data-row-id="${row.id}" aria-label="${a.label}">
                  <img src="assets/icons/${a.icon}.svg" alt="" />
                </button>`
            )
            .join("")}</td>`
        : "";
      return `<tr>${cells}${actions}</tr>`;
    })
    .join("");

  container.innerHTML = `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;

  if (onAction) {
    container.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => onAction(btn.dataset.action, btn.dataset.rowId));
    });
  }
}
