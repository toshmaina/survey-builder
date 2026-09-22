const STORAGE_KEY = "survey_builder_surveys_v1";

export function loadSurveys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read surveys from localStorage:", err);
    return [];
  }
}

export function saveSurveys(surveys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys));
    return true;
  } catch (err) {
    console.error("Failed to write surveys to localStorage:", err);
    return false;
  }
}
