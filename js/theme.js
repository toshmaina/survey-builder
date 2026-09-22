document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;

  const STORAGE_KEYS = {
    theme: "tatua-color-scheme",
    fontFamily: "tatua-font-family",
    fontSize: "tatua-font-size",
    spacing: "tatua-spacing",
    borderRadius: "tatua-border-radius",
  };

  // --- 1. LOAD PREFERENCES ON PAGE LOAD ---
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const savedFontFamily = localStorage.getItem(STORAGE_KEYS.fontFamily);
  const savedFontSize = localStorage.getItem(STORAGE_KEYS.fontSize);
  const savedSpacing = localStorage.getItem(STORAGE_KEYS.spacing);
  const savedBorderRadius = localStorage.getItem(STORAGE_KEYS.borderRadius);

  if (savedTheme && savedTheme !== "blue") {
    root.classList.add("theme-" + savedTheme);
  }

  if (savedFontFamily) root.style.setProperty("--font-family", savedFontFamily);
  if (savedFontSize) root.style.setProperty("--base-font-size", savedFontSize + "px");
  if (savedSpacing) root.style.setProperty("--spacing-multiplier", savedSpacing);
  if (savedBorderRadius) root.style.setProperty("--border-radius", savedBorderRadius + "px");

  // --- 2. HANDLE THEME WIDGET UI ---
  const themePanel = document.getElementById("theme-panel");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeCloseBtn = document.getElementById("theme-close-btn");

  if (!themePanel || !themeToggleBtn || !themeCloseBtn) return;

  themeToggleBtn.addEventListener("click", () => {
    themePanel.classList.toggle("is-open");
  });

  themeCloseBtn.addEventListener("click", () => {
    themePanel.classList.remove("is-open");
  });

  const colorSchemeSelect = document.getElementById("color-scheme");
  const fontFamilySelect = document.getElementById("font-family");
  const fontSizeInput = document.getElementById("font-size");
  const spacingInput = document.getElementById("spacing");
  const borderRadiusInput = document.getElementById("border-radius");

  if (savedTheme) colorSchemeSelect.value = savedTheme;
  if (savedFontFamily) fontFamilySelect.value = savedFontFamily;
  if (savedFontSize) fontSizeInput.value = savedFontSize;
  if (savedSpacing) spacingInput.value = savedSpacing;
  if (savedBorderRadius) borderRadiusInput.value = savedBorderRadius;

  colorSchemeSelect.addEventListener("change", (e) => {
    root.classList.remove("theme-orange", "theme-purple");
    const val = e.target.value;
    if (val !== "blue") {
      root.classList.add("theme-" + val);
    }
    localStorage.setItem(STORAGE_KEYS.theme, val);
  });

  fontFamilySelect.addEventListener("change", (e) => {
    const val = e.target.value;
    root.style.setProperty("--font-family", val);
    localStorage.setItem(STORAGE_KEYS.fontFamily, val);
  });

  fontSizeInput.addEventListener("input", (e) => {
    const val = e.target.value;
    root.style.setProperty("--base-font-size", val + "px");
    localStorage.setItem(STORAGE_KEYS.fontSize, val);
  });

  spacingInput.addEventListener("input", (e) => {
    const val = e.target.value;
    root.style.setProperty("--spacing-multiplier", val);
    localStorage.setItem(STORAGE_KEYS.spacing, val);
  });

  borderRadiusInput.addEventListener("input", (e) => {
    const val = e.target.value;
    root.style.setProperty("--border-radius", val + "px");
    localStorage.setItem(STORAGE_KEYS.borderRadius, val);
  });
});
