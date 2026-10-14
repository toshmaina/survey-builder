export function renderTable(container, { columns, rows, cellRenderers, rowActions, onAction, emptyMessage }) {
  const relations = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
  ];

  let filterState = { col: "", rel: "", val: "" };
  let sortState = []; // [{ col, dir }] — header click keeps this to a single entry; the dialog can build a multi-column list
  let currentPage = 1;
  let pageSize = 50;
  // Which columns are currently shown. Starts as "all of them"; the Columns
  // dialog toggles membership. Never allowed to go empty (see the checkbox
  // handler below) so the table can't be toggled into a blank-looking state.
  let visibleColumns = new Set(columns.map((c) => c.key));

  const columnOptions = (selected = "") =>
    columns.map((c) => `<option value="${c.key}" ${c.key === selected ? "selected" : ""}>${c.label}</option>`).join("");
  const relationOptions = (selected = "equals") =>
    relations.map((r) => `<option value="${r.value}" ${r.value === selected ? "selected" : ""}>${r.label}</option>`).join("");

  const getCellText = (row, colKey) => {
    const rawValue = row[colKey];
    if (cellRenderers && cellRenderers[colKey]) {
      return String(cellRenderers[colKey](row)).replace(/<[^>]*>?/gm, ""); // strip HTML
    }
    return String(rawValue ?? "");
  };

  // The Search button + Column/Relation/Value trio replace the old free-text
  // search box. Each control is required, and shows the CSS-only
  // :user-invalid red border/icon/message (same pattern as the question
  // form) if Search is clicked before all three are filled in.
  const searchFormHTML = `
    <form id="quick-search-form" class="data-table__search-form" novalidate>
      <div class="field field--validated" style="margin-bottom:0;">
        <div class="input-with-icon">
          <select id="quick-filter-column" aria-label="Column to search" required>
            <option value="">Coloumn</option>
            ${columnOptions()}
          </select>
          <img class="input-icon" src="assets/icons/exclamation.png" alt="" aria-hidden="true" />
        </div>
        <p class="field-error-text">Column is required!</p>
      </div>
      <div class="field field--validated" style="margin-bottom:0;">
        <div class="input-with-icon">
          <select id="quick-filter-relation" aria-label="Relation" required>
            <option value="">Rel</option>
            ${relationOptions()}
          </select>
          <img class="input-icon" src="assets/icons/exclamation.png" alt="" aria-hidden="true" />
        </div>
        <p class="field-error-text">Relation is required!</p>
      </div>
      <div class="field field--validated" style="margin-bottom:0;">
        <div class="input-with-icon">
          <input type="text" id="quick-filter-value" placeholder="Value" required />
          <img class="input-icon" src="assets/icons/exclamation.png" alt="" aria-hidden="true" />
        </div>
        <p class="field-error-text">Value is required!</p>
      </div>
      <button type="submit" class="btn btn--primary">
        <img src="assets/icons/search.png" alt="" /> Search
      </button>
    </form>
  `;

  const toolbarHTML = `
    <div class="data-table__toolbar">
      <div class="data-table__toolbar-controls">
        ${searchFormHTML}
      </div>
      <div class="data-table__toolbar-actions">
        <button type="button" class="btn btn--primary" id="btn-open-sorting">
          <img src="assets/icons/sort.png" alt="" /> Sorting
        </button>
        <button type="button" class="btn btn--primary" id="btn-open-filters">
          <img src="assets/icons/filter.png" alt="" /> Filters
        </button>
        <button type="button" class="btn btn--ghost" id="btn-open-columns">
          <img src="assets/icons/menu.png" alt="" /> COLUMNS
        </button>
      </div>
    </div>
  `;

  const filtersDialogHTML = `
    <dialog id="dialog-filters" class="dialog">
      <div class="dialog__head"><h2>Filter Options</h2></div>
      <div class="dialog__body">
        <div class="dialog-row" style="display: flex; gap: var(--space-2); align-items: center;">
          <div class="field" style="margin-bottom: 0; flex: 1;">
            <select class="form-control" id="dialog-filter-column">
              <option value="">Column Name</option>
              ${columnOptions()}
            </select>
          </div>
          <div class="field" style="margin-bottom: 0; flex: 1;">
            <select class="form-control" id="dialog-filter-relation">
              <option value="">Relation</option>
              ${relationOptions()}
            </select>
          </div>
          <div class="field" style="margin-bottom: 0; flex: 1;">
            <input type="text" id="dialog-filter-value" class="form-control" placeholder="Value" />
          </div>
          <button type="button" class="btn btn--icon" aria-label="Add Filter">
            <img src="assets/icons/plus.svg" alt="add" />
          </button>
          <button type="button" class="btn btn--icon" aria-label="Delete">
            <img src="assets/icons/trash.svg" alt="delete" />
          </button>
        </div>
      </div>
      <div class="dialog__foot">
        <button type="button" class="btn btn--secondary" id="btn-reset-filters" style="margin-right: auto;">Reset filters</button>
        <button type="button" class="btn btn--secondary" id="btn-cancel-filters">Cancel</button>
        <button type="button" class="btn btn--primary" id="btn-apply-filters">Apply filters</button>
      </div>
    </dialog>
  `;

  const sortRowTemplate = `
    <div class="dialog-row sort-row" style="display: flex; gap: var(--space-2); align-items: center; margin-bottom: var(--space-3);">
      <div class="field" style="margin-bottom: 0; flex: 1;">
        <select class="form-control sort-column">
          <option value="">Column Name</option>
          ${columnOptions()}
        </select>
      </div>
      <div class="field" style="margin-bottom: 0; flex: 1;">
        <select class="form-control sort-direction">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <button type="button" class="btn btn--icon btn-add-sort" aria-label="Add Sorting">
        <img src="assets/icons/plus.svg" alt="add" />
      </button>
      <button type="button" class="btn btn--icon btn-delete-sort" aria-label="Delete">
        <img src="assets/icons/trash.svg" alt="delete" />
      </button>
    </div>
  `;

  const sortingDialogHTML = `
    <dialog id="dialog-sorting" class="dialog">
      <div class="dialog__head"><h2>Sorting Options</h2></div>
      <div class="dialog__body" id="sorting-rows-container">
        ${sortRowTemplate}
      </div>
      <div class="dialog__foot">
        <button type="button" class="btn btn--secondary" id="btn-reset-sorting" style="margin-right: auto;">Reset sorting</button>
        <button type="button" class="btn btn--secondary" id="btn-cancel-sorting">Cancel</button>
        <button type="button" class="btn btn--primary" id="btn-apply-sorting">Apply sorting</button>
      </div>
    </dialog>
  `;

  // One checkbox per real data column (row-action buttons aren't a "column"
  // and can't be hidden).
  const columnsDialogHTML = `
    <dialog id="dialog-columns" class="dialog">
      <div class="dialog__head"><h2>Columns</h2></div>
      <div class="dialog__body">
        <div class="columns-menu-list" id="columns-menu-list">
          ${columns
            .map(
              (c) => `
            <label class="checkbox-row">
              <input type="checkbox" class="column-toggle-checkbox" value="${c.key}" checked />
              ${c.label}
            </label>`
            )
            .join("")}
        </div>
      </div>
      <div class="dialog__foot">
        <button type="button" class="btn btn--primary" id="btn-done-columns">Done</button>
      </div>
    </dialog>
  `;

  container.innerHTML = `
      <div class="data-table-component">
        ${rows.length ? toolbarHTML : ""}
        ${sortingDialogHTML}
        ${filtersDialogHTML}
        ${columnsDialogHTML}
        ${!rows.length ? `<div class="empty-state"><strong>Nothing here yet</strong>${emptyMessage || ""}</div>` : `
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr id="data-table-head-row"></tr></thead>
              <tbody id="data-table-body"></tbody>
            </table>
            <div id="pagination-container"></div>
          </div>
        `}
      </div>
    `;

  if (!rows.length) return;

  const headRow = container.querySelector("#data-table-head-row");

  function renderHead() {
    const dataCells = columns
      .filter((c) => visibleColumns.has(c.key))
      .map((c) => {
        if (!c.sortable) return `<th>${c.label}</th>`;
        const active = sortState[0]?.col === c.key;
        const direction = active ? sortState[0].dir : "";
        return `
          <th class="is-sortable" data-sort-col="${c.key}" aria-sort="${active ? (direction === "asc" ? "ascending" : "descending") : "none"}">
            <span class="th-sort-trigger">
              ${c.label}
              <img class="sort-indicator-icon" src="assets/icons/sort.png" alt="" data-active="${active}" data-direction="${direction}" />
            </span>
          </th>`;
      })
      .join("");
    headRow.innerHTML = dataCells + (rowActions ? "<th></th>" : "");
  }

  const updateTableData = () => {
    renderHead();

    let result = [...rows];

    if (filterState.col && filterState.rel && filterState.val !== "") {
      result = result.filter((row) => {
        const targetStr = getCellText(row, filterState.col).toLowerCase();
        const rawValue = row[filterState.col];
        const numTarget = Number(rawValue);
        const numVal = Number(filterState.val);
        const isNumericCompare = !isNaN(numTarget) && !isNaN(numVal);

        switch (filterState.rel) {
          case "equals":
            return targetStr === filterState.val;
          case "not_equals":
            return targetStr !== filterState.val;
          case "contains":
            return targetStr.includes(filterState.val);
          case "starts_with":
            return targetStr.startsWith(filterState.val);
          case "ends_with":
            return targetStr.endsWith(filterState.val);
          case "greater_than":
            return isNumericCompare ? numTarget > numVal : targetStr > filterState.val;
          case "less_than":
            return isNumericCompare ? numTarget < numVal : targetStr < filterState.val;
          default:
            return true;
        }
      });
    }

    if (sortState.length > 0) {
      result.sort((a, b) => {
        for (let { col, dir } of sortState) {
          let valA = a[col] ?? "";
          let valB = b[col] ?? "";
          let numA = Number(valA);
          let numB = Number(valB);

          if (!isNaN(numA) && !isNaN(numB)) {
            if (numA < numB) return dir === "asc" ? -1 : 1;
            if (numA > numB) return dir === "asc" ? 1 : -1;
          } else {
            let strA = String(valA).toLowerCase();
            let strB = String(valB).toLowerCase();
            if (strA < strB) return dir === "asc" ? -1 : 1;
            if (strA > strB) return dir === "asc" ? 1 : -1;
          }
        }
        return 0;
      });
    }

    const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const paginatedRows = result.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const visibleColumnDefs = columns.filter((c) => visibleColumns.has(c.key));
    const tbody = container.querySelector("#data-table-body");
    if (tbody) {
      if (!paginatedRows.length) {
        tbody.innerHTML = `<tr><td colspan="${visibleColumnDefs.length + (rowActions ? 1 : 0)}" style="text-align: center; padding: var(--space-5); color: var(--color-text-muted);">No matching records found.</td></tr>`;
      } else {
        tbody.innerHTML = paginatedRows
          .map((row) => {
            const cells = visibleColumnDefs
              .map((c) => `<td>${cellRenderers && cellRenderers[c.key] ? cellRenderers[c.key](row) : row[c.key] ?? ""}</td>`)
              .join("");
            const actions = rowActions
              ? `<td class="data-table__actions">${rowActions
                  .map(
                    (a) =>
                      `<button type="button" class="btn btn--icon" data-action="${a.action}" data-row-id="${row.id}" aria-label="${a.label}"><img src="assets/icons/${a.icon}.svg" alt="${a.icon}" /></button>`
                  )
                  .join("")}</td>`
              : "";
            return `<tr>${cells}${actions}</tr>`;
          })
          .join("");
      }

      if (onAction) {
        tbody.querySelectorAll("[data-action]").forEach((btn) => {
          btn.addEventListener("click", () => onAction(btn.dataset.action, btn.dataset.rowId));
        });
      }
    }

    const paginationContainer = container.querySelector("#pagination-container");
    if (paginationContainer && rows.length > 0) {
      paginationContainer.innerHTML = `
        <div class="data-table__pagination">
        <button type="button" class="btn btn--icon" id="btn-prev-page" ${currentPage === 1 ? 'disabled' : ''} style="opacity: ${currentPage === 1 ? '0.5' : '1'}; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">                <img src="assets/icons/chevron-left.svg" alt="previous page" />              </button>
          <div class="data-table__pagination-center">
            <div class="field" style="margin-bottom: 0;">
              <label for="page-size-select" style="margin:0;">Rows per page</label>
              <select id="page-size-select">
                <option value="10" ${pageSize === 10 ? "selected" : ""}>10</option>
                <option value="50" ${pageSize === 50 ? "selected" : ""}>50</option>
                <option value="100" ${pageSize === 100 ? "selected" : ""}>100</option>
              </select>
            </div>
             <span style="font-size: var(--fs-sm); font-weight: 500; color: var(--color-text-muted);">Page ${currentPage} of ${totalPages}</span>
          </div>
          <button type="button" class="btn btn--icon" id="btn-next-page" ${currentPage === totalPages ? 'disabled' : ''} style="opacity: ${currentPage === totalPages ? '0.5' : '1'}; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">                <img src="assets/icons/chevron-right.svg" alt="next page" />              </button>
        </div>
      `;

      paginationContainer.querySelector("#btn-prev-page")?.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          updateTableData();
        }
      });
      paginationContainer.querySelector("#btn-next-page")?.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          updateTableData();
        }
      });
      paginationContainer.querySelector("#page-size-select")?.addEventListener("change", (e) => {
        pageSize = Number(e.target.value);
        currentPage = 1;
        updateTableData();
      });
    }
  };

  updateTableData();

  // ---- column header click-to-sort ----
  headRow.addEventListener("click", (e) => {
    const th = e.target.closest("th[data-sort-col]");
    if (!th) return;
    const col = th.dataset.sortCol;
    const current = sortState[0];
    const dir = current && current.col === col ? (current.dir === "asc" ? "desc" : "asc") : "asc";
    sortState = [{ col, dir }];
    currentPage = 1;
    updateTableData();
  });

  // ---- Search button (replaces the old free-text search input) ----
  const searchForm = container.querySelector("#quick-search-form");
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Red borders/icons/messages are handled entirely by CSS (:user-invalid)
    // — this just blocks the actual search until the form is valid.
    if (!searchForm.checkValidity()) return;
    filterState.col = container.querySelector("#quick-filter-column").value;
    filterState.rel = container.querySelector("#quick-filter-relation").value;
    filterState.val = container.querySelector("#quick-filter-value").value.toLowerCase().trim();
    currentPage = 1;
    updateTableData();
  });

  // ---- Filters / Sorting / Columns dialogs ----
  const sortingDialog = container.querySelector("#dialog-sorting");
  const filtersDialog = container.querySelector("#dialog-filters");
  const columnsDialog = container.querySelector("#dialog-columns");

  container.querySelector("#btn-open-sorting")?.addEventListener("click", () => sortingDialog.showModal());
  container.querySelector("#btn-cancel-sorting")?.addEventListener("click", () => sortingDialog.close());
  container.querySelector("#btn-open-filters")?.addEventListener("click", () => filtersDialog.showModal());
  container.querySelector("#btn-cancel-filters")?.addEventListener("click", () => filtersDialog.close());
  container.querySelector("#btn-open-columns")?.addEventListener("click", () => columnsDialog.showModal());
  container.querySelector("#btn-done-columns")?.addEventListener("click", () => columnsDialog.close());

  container.querySelector("#btn-apply-filters")?.addEventListener("click", () => {
    filterState.col = container.querySelector("#dialog-filter-column").value;
    filterState.rel = container.querySelector("#dialog-filter-relation").value;
    filterState.val = container.querySelector("#dialog-filter-value").value.toLowerCase().trim();
    currentPage = 1;
    updateTableData();
    filtersDialog.close();
  });

  container.querySelector("#btn-reset-filters")?.addEventListener("click", () => {
    container.querySelector("#dialog-filter-column").value = "";
    container.querySelector("#dialog-filter-relation").value = "";
    container.querySelector("#dialog-filter-value").value = "";
    filterState = { col: "", rel: "", val: "" };
    currentPage = 1;
    updateTableData();
    filtersDialog.close();
  });

  const sortingRowsContainer = container.querySelector("#sorting-rows-container");
  if (sortingRowsContainer) {
    sortingRowsContainer.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".btn-add-sort");
      const delBtn = e.target.closest(".btn-delete-sort");

      if (addBtn) {
        sortingRowsContainer.insertAdjacentHTML("beforeend", sortRowTemplate);
      }

      if (delBtn) {
        const sortRows = sortingRowsContainer.querySelectorAll(".sort-row");
        if (sortRows.length > 1) {
          delBtn.closest(".sort-row").remove();
        } else {
          const row = delBtn.closest(".sort-row");
          row.querySelector(".sort-column").value = "";
          row.querySelector(".sort-direction").value = "asc";
        }
      }
    });
  }

  container.querySelector("#btn-apply-sorting")?.addEventListener("click", () => {
    sortState = [];
    const sortRows = sortingRowsContainer.querySelectorAll(".sort-row");
    sortRows.forEach((row) => {
      const col = row.querySelector(".sort-column").value;
      const dir = row.querySelector(".sort-direction").value;
      if (col) sortState.push({ col, dir });
    });
    currentPage = 1;
    updateTableData();
    sortingDialog.close();
  });

  container.querySelector("#btn-reset-sorting")?.addEventListener("click", () => {
    sortState = [];
    sortingRowsContainer.innerHTML = sortRowTemplate;
    updateTableData();
    sortingDialog.close();
  });

  // ---- Columns visibility ----
  container.querySelector("#columns-menu-list")?.addEventListener("change", (e) => {
    const checkbox = e.target.closest(".column-toggle-checkbox");
    if (!checkbox) return;
    const key = checkbox.value;
    if (!checkbox.checked) {
      // Never allow hiding the last visible column — that would leave a
      // table with no data cells at all, just row-action buttons.
      if (visibleColumns.size <= 1) {
        checkbox.checked = true;
        return;
      }
      visibleColumns.delete(key);
    } else {
      visibleColumns.add(key);
    }
    updateTableData();
  });
}
