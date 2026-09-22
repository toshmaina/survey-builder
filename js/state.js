import { loadSurveys, saveSurveys } from "./storage.js";
import { uid } from "./utils/id.js";

let surveys = loadSurveys();
const subscribers = new Set();

function notify() {
  saveSurveys(surveys);
  subscribers.forEach((fn) => fn());
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getSurveys() {
  return surveys;
}

export function getSurvey(id) {
  return surveys.find((s) => s.id === id) || null;
}

export function createSurvey({ title, description, status }) {
  const now = new Date().toISOString();
  const survey = {
    id: uid(),
    title: title.trim(),
    description: (description || "").trim(),
    status: status || "draft",
    createdAt: now,
    updatedAt: now,
    questions: [],
  };
  surveys = [survey, ...surveys];
  notify();
  return survey;
}

export function updateSurvey(id, { title, description, status }) {
  surveys = surveys.map((s) =>
    s.id === id
      ? {
          ...s,
          title: title.trim(),
          description: (description || "").trim(),
          status,
          updatedAt: new Date().toISOString(),
        }
      : s
  );
  notify();
}

export function deleteSurvey(id) {
  surveys = surveys.filter((s) => s.id !== id);
  notify();
}

export function createQuestion(surveyId, data) {
  surveys = surveys.map((s) => {
    if (s.id !== surveyId) return s;
    const question = {
      id: uid(),
      order: s.questions.length,
      ...data,
    };
    return { ...s, questions: [...s.questions, question], updatedAt: new Date().toISOString() };
  });
  notify();
}

export function updateQuestion(surveyId, questionId, data) {
  surveys = surveys.map((s) => {
    if (s.id !== surveyId) return s;
    return {
      ...s,
      updatedAt: new Date().toISOString(),
      questions: s.questions.map((q) => (q.id === questionId ? { ...q, ...data } : q)),
    };
  });
  notify();
}

export function deleteQuestion(surveyId, questionId) {
  surveys = surveys.map((s) => {
    if (s.id !== surveyId) return s;
    const remaining = s.questions
      .filter((q) => q.id !== questionId)
      .map((q, index) => ({ ...q, order: index }));
    return { ...s, questions: remaining, updatedAt: new Date().toISOString() };
  });
  notify();
}

export function reorderQuestion(surveyId, questionId, direction) {
  surveys = surveys.map((s) => {
    if (s.id !== surveyId) return s;
    const list = [...s.questions].sort((a, b) => a.order - b.order);
    const index = list.findIndex((q) => q.id === questionId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= list.length) return s;
    [list[index], list[swapWith]] = [list[swapWith], list[index]];
    const reordered = list.map((q, i) => ({ ...q, order: i }));
    return { ...s, questions: reordered, updatedAt: new Date().toISOString() };
  });
  notify();
}
