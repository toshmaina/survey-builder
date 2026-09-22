const dialogEl = document.getElementById("app-dialog");

/**
 * Opens the single shared dialog with the given inner HTML.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.bodyHtml
 * @param {string} [opts.footHtml]
 * @param {(root: HTMLElement) => void} [opts.onMount] - called after the content is in the DOM
 */
export function openDialog({ title, bodyHtml, footHtml = "", onMount }) {
  dialogEl.innerHTML = `
    <div class="dialog__head">
      <h2>${title}</h2>
      <button type="button" class="btn btn--icon" data-dialog-close aria-label="Close">✕</button>
    </div>
    <div class="dialog__body">${bodyHtml}</div>
    ${footHtml ? `<div class="dialog__foot">${footHtml}</div>` : ""}
  `;

  dialogEl.querySelector("[data-dialog-close]").addEventListener("click", closeDialog);

  if (typeof dialogEl.showModal === "function") {
    dialogEl.showModal();
  } else {
    dialogEl.setAttribute("open", "");
  }

  if (onMount) onMount(dialogEl);
}

export function closeDialog() {
  if (typeof dialogEl.close === "function" && dialogEl.open) {
    dialogEl.close();
  } else {
    dialogEl.removeAttribute("open");
  }
  dialogEl.innerHTML = "";
}

dialogEl.addEventListener("click", (e) => {
  const rect = dialogEl.getBoundingClientRect();
  const inBounds =
    e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inBounds) closeDialog();
});
