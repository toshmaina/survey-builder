
export function renderTable(container, { columns, rows, cellRenderers, rowActions, onAction, emptyMessage }) {
  const currentUrl = window.location.hash;
  const isSurveysList = currentUrl === '#/surveys' || currentUrl === '';

  const relations = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" }
  ];

  let filterState = { col: '', rel: '', val: '', global: '' };
  let sortState = []; 
  let currentPage = 1;
  let pageSize = 50;

  const columnOptions = columns.map(c => `<option value="${c.key}">${c.label}</option>`).join("");
  const relationOptions = relations.map(r => `<option value="${r.value}">${r.label}</option>`).join("");
  const head = columns.map((c) => `<th>${c.label}</th>`).join("") + (rowActions ? "<th></th>" : "");

  const getCellText = (row, colKey) => {
    const rawValue = row[colKey];
    if (cellRenderers && cellRenderers[colKey]) {
      return String(cellRenderers[colKey](row)).replace(/<[^>]*>?/gm, ''); // strip HTML
    }
    return String(rawValue ?? "");
  };

  const toolbarHTML = `
    <div class="data-table__toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); gap: var(--space-4); flex-wrap: wrap;">
      <div class="data-table__toolbar-controls" style="display: flex; gap: var(--space-2); align-items: center; flex: 1; min-width: 300px;">
        <div class="field" style="margin-bottom: 0;">
           <select class="form-control" id="quick-filter-column" aria-label="Column to filter">
             <option value="">Column</option>
             ${columnOptions}
           </select>
        </div>
        <div class="field" style="margin-bottom: 0;">
           <select class="form-control" id="quick-filter-relation" aria-label="Filter relation">
             <option value="">Rel</option>
             ${relationOptions}
           </select>
        </div>
        <div class="field" style="margin-bottom: 0;">
           <input type="text" id="quick-filter-value" class="form-control" placeholder="Value" />
        </div>
        <div class="input-with-icon field" style="margin-bottom: 0; min-width: 200px;">
          <input type="search" id="quick-search-input" class="form-control" placeholder="Search" />
          <img class="input-icon" src="assets/icons/search.png" alt="search icon" style="display: block;" />
        </div>
      </div>

      <div class="data-table__toolbar-actions" style="display: flex; gap: var(--space-2);">
        <button type="button" class="btn btn--primary" id="btn-open-sorting" style="background-color: #ea580c; border-color: #ea580c; border-radius: 8px;">
           <img src="assets/icons/sort.png" alt="sort" style="filter: invert(1);"/> Sorting
        </button>
        <button type="button" class="btn btn--primary" id="btn-open-filters" style="background-color: #ea580c; border-color: #ea580c; border-radius: 8px;">
          <img src="assets/icons/filter-binary.png" alt="filter" style="filter: invert(1);"/> Filters
        </button>
      </div>
    </div>
  `;

  const filtersDialogHTML = `
    <dialog id="dialog-filters" class="dialog" style="padding: 0;">
      <div class="dialog__head">
        <h2>Filter Options</h2>
      </div>
      <div class="dialog__body">
        <div class="dialog-row" style="display: flex; gap: var(--space-2); align-items: center;">
          <div class="field" style="margin-bottom: 0; flex: 1;">
             <select class="form-control" id="dialog-filter-column">
               <option value="">Column Name</option>
               ${columnOptions}
             </select>
          </div>
          <div class="field" style="margin-bottom: 0; flex: 1;">
             <select class="form-control" id="dialog-filter-relation">
               <option value="">Relation</option>
               ${relationOptions}
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
        <button type="button" class="btn btn--icon" id="btn-reset-filters" style="margin-right: auto;">Reset filters</button>
        <button type="button" class="btn btn--icon" id="btn-cancel-filters">Cancel</button>
        <button type="button" class="btn btn--primary" id="btn-apply-filters" style="background-color: #ea580c;">Apply filters</button>
      </div>
    </dialog>
  `;

  const sortRowTemplate = `
    <div class="dialog-row sort-row" style="display: flex; gap: var(--space-2); align-items: center; margin-bottom: var(--space-3);">
      <div class="field" style="margin-bottom: 0; flex: 1;">
         <select class="form-control sort-column">
           <option value="">Column Name</option>
           ${columnOptions}
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
    <dialog id="dialog-sorting" class="dialog" style="padding: 0;">
      <div class="dialog__head"><h2>Sorting Options</h2></div>
      <div class="dialog__body" id="sorting-rows-container">
        ${sortRowTemplate}
      </div>
      <div class="dialog__foot">
        <button type="button" class="btn btn--icon" id="btn-reset-sorting" style="margin-right: auto;">Reset sorting</button>
        <button type="button" class="btn btn--icon" id="btn-cancel-sorting">Cancel</button>
        <button type="button" class="btn btn--primary" id="btn-apply-sorting" style="background-color: #ea580c;">Apply sorting</button>
      </div>
    </dialog>
  `;

  container.innerHTML = `
      <div class="data-table-component">
        ${rows.length ? toolbarHTML : ''}
        ${sortingDialogHTML}
        ${filtersDialogHTML}
        ${!rows.length ? `<div class="empty-state"><strong>Nothing here yet</strong>${emptyMessage || ""}</div>` : `
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr>${head}</tr></thead>
              <tbody id="data-table-body"></tbody>
            </table>
            <div id="pagination-container"></div> <!-- Moved INSIDE the wrap -->
          </div>
        `}
      </div>
    `;

  if (!rows.length) return;

  const updateTableData = () => {
    let result = [...rows];

    if (filterState.global) {
      result = result.filter(row =>
        columns.some(c => getCellText(row, c.key).toLowerCase().includes(filterState.global))
      );
    }

    if (filterState.col && filterState.rel && filterState.val !== '') {
      result = result.filter(row => {
        const targetStr = getCellText(row, filterState.col).toLowerCase();
        const rawValue = row[filterState.col];
        const numTarget = Number(rawValue);
        const numVal = Number(filterState.val);
        const isNumericCompare = !isNaN(numTarget) && !isNaN(numVal);

        switch (filterState.rel) {
          case 'equals': return targetStr === filterState.val;
          case 'not_equals': return targetStr !== filterState.val;
          case 'contains': return targetStr.includes(filterState.val);
          case 'starts_with': return targetStr.startsWith(filterState.val);
          case 'ends_with': return targetStr.endsWith(filterState.val);
          case 'greater_than': return isNumericCompare ? numTarget > numVal : targetStr > filterState.val;
          case 'less_than': return isNumericCompare ? numTarget < numVal : targetStr < filterState.val;
          default: return true;
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
            if (numA < numB) return dir === 'asc' ? -1 : 1;
            if (numA > numB) return dir === 'asc' ? 1 : -1;
          } else {
            let strA = String(valA).toLowerCase();
            let strB = String(valB).toLowerCase();
            if (strA < strB) return dir === 'asc' ? -1 : 1;
            if (strA > strB) return dir === 'asc' ? 1 : -1;
          }
        }
        return 0;
      });
    }

    const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const paginatedRows = result.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const tbody = container.querySelector('#data-table-body');
    if (tbody) {
      if (!paginatedRows.length) {
        tbody.innerHTML = `<tr><td colspan="${columns.length + (rowActions ? 1 : 0)}" style="text-align: center; padding: var(--space-5); color: var(--color-text-muted);">No matching records found.</td></tr>`;
      } else {
        tbody.innerHTML = paginatedRows.map((row) => {
          const cells = columns.map((c) => `<td>${cellRenderers && cellRenderers[c.key] ? cellRenderers[c.key](row) : row[c.key] ?? ""}</td>`).join("");
          const actions = rowActions ? `<td class="data-table__actions">${rowActions.map(a => `<button type="button" class="btn btn--icon" data-action="${a.action}" data-row-id="${row.id}" aria-label="${a.label}"><img src="assets/icons/${a.icon}.svg" alt="${a.icon}" /></button>`).join("")}</td>` : "";
          return `<tr>${cells}${actions}</tr>`;
        }).join("");
      }

      if (onAction) {
        tbody.querySelectorAll("[data-action]").forEach((btn) => {
          btn.addEventListener("click", () => onAction(btn.dataset.action, btn.dataset.rowId));
        });
      }
    }

    const paginationContainer = container.querySelector('#pagination-container');
        if (paginationContainer && rows.length > 0) {
          paginationContainer.innerHTML = `
            <div class="data-table__pagination" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); background: var(--color-secondary); border-top: 1px solid var(--color-border);">
              <button type="button" class="btn btn--icon" id="btn-prev-page" ${currentPage === 1 ? 'disabled' : ''} style="opacity: ${currentPage === 1 ? '0.5' : '1'}; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
                <img src="assets/icons/chevron-left.svg" alt="previous page" />
              </button>

              <div style="display: flex; align-items: center; gap: var(--space-4);">
                  <div class="field checkbox-row" style="margin-bottom: 0;">
                    <label style="margin:0; font-weight: 500; font-size: var(--fs-xs); color: var(--color-text-muted);">Rows per page:</label>
                    <select class="form-control" id="page-size-select" style="width: auto; padding: 4px 28px 4px 8px; font-size: var(--fs-sm); height: auto;">
                      <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                      <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                      <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
                    </select>
                  </div>
                  <span style="font-size: var(--fs-sm); font-weight: 500; color: var(--color-text-muted);">Page ${currentPage} of ${totalPages}</span>
              </div>

              <button type="button" class="btn btn--icon" id="btn-next-page" ${currentPage === totalPages ? 'disabled' : ''} style="opacity: ${currentPage === totalPages ? '0.5' : '1'}; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
                <img src="assets/icons/chevron-right.svg" alt="next page" />
              </button>
            </div>
          `;

      paginationContainer.querySelector('#btn-prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; updateTableData(); }
      });
      paginationContainer.querySelector('#btn-next-page')?.addEventListener('click', () => {
        if (currentPage < totalPages) { currentPage++; updateTableData(); }
      });
      paginationContainer.querySelector('#page-size-select')?.addEventListener('change', (e) => {
        pageSize = Number(e.target.value);
        currentPage = 1;
        updateTableData();
      });
    }
  };

  updateTableData();

  const sortingDialog = container.querySelector('#dialog-sorting');
  const filtersDialog = container.querySelector('#dialog-filters');

  container.querySelector('#btn-open-sorting')?.addEventListener('click', () => sortingDialog.showModal());
  container.querySelector('#btn-cancel-sorting')?.addEventListener('click', () => sortingDialog.close());
  container.querySelector('#btn-open-filters')?.addEventListener('click', () => filtersDialog.showModal());
  container.querySelector('#btn-cancel-filters')?.addEventListener('click', () => filtersDialog.close());

  const applyQuickFilters = () => {
    filterState.col = container.querySelector('#quick-filter-column').value;
    filterState.rel = container.querySelector('#quick-filter-relation').value;
    filterState.val = container.querySelector('#quick-filter-value').value.toLowerCase().trim();
    currentPage = 1;
    updateTableData();
  };

  ['#quick-filter-column', '#quick-filter-relation', '#quick-filter-value'].forEach(selector => {
    container.querySelector(selector)?.addEventListener('input', applyQuickFilters);
  });

  container.querySelector('#quick-search-input')?.addEventListener('input', (e) => {
    filterState.global = e.target.value.toLowerCase().trim();
    currentPage = 1;
    updateTableData();
  });

  container.querySelector('#btn-apply-filters')?.addEventListener('click', () => {
    filterState.col = container.querySelector('#dialog-filter-column').value;
    filterState.rel = container.querySelector('#dialog-filter-relation').value;
    filterState.val = container.querySelector('#dialog-filter-value').value.toLowerCase().trim();
    currentPage = 1;
    updateTableData();
    filtersDialog.close();
  });

  container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
    container.querySelector('#dialog-filter-column').value = '';
    container.querySelector('#dialog-filter-relation').value = '';
    container.querySelector('#dialog-filter-value').value = '';
    filterState = { col: '', rel: '', val: '', global: filterState.global };
    currentPage = 1;
    updateTableData();
    filtersDialog.close();
  });

  const sortingRowsContainer = container.querySelector('#sorting-rows-container');
  if (sortingRowsContainer) {
    sortingRowsContainer.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-add-sort');
      const delBtn = e.target.closest('.btn-delete-sort');

      if (addBtn) {
        sortingRowsContainer.insertAdjacentHTML('beforeend', sortRowTemplate);
      }

      if (delBtn) {
        const rows = sortingRowsContainer.querySelectorAll('.sort-row');
        if (rows.length > 1) {
          delBtn.closest('.sort-row').remove();
        } else {
          const row = delBtn.closest('.sort-row');
          row.querySelector('.sort-column').value = '';
          row.querySelector('.sort-direction').value = 'asc';
        }
      }
    });
  }

  container.querySelector('#btn-apply-sorting')?.addEventListener('click', () => {
    sortState = [];
    const rows = sortingRowsContainer.querySelectorAll('.sort-row');
    rows.forEach(row => {
      const col = row.querySelector('.sort-column').value;
      const dir = row.querySelector('.sort-direction').value;
      if (col) sortState.push({ col, dir });
    });
    currentPage = 1;
    updateTableData();
    sortingDialog.close();
  });

  container.querySelector('#btn-reset-sorting')?.addEventListener('click', () => {
    sortState = [];
    sortingRowsContainer.innerHTML = sortRowTemplate; 
    updateTableData();
    sortingDialog.close();
  });
}
