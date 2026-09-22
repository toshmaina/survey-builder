import { addRoute, startRouter } from "./router.js";
import { renderSurveyListView } from "./views/surveyListView.js";
import { renderSurveyDetailsView } from "./views/surveyDetailsView.js";

const root = document.getElementById("app");
let currentUnsubscribe = null;

function mount(renderFn, ...args) {
  if (currentUnsubscribe) currentUnsubscribe();
  currentUnsubscribe = renderFn(root, ...args) || null;
}

addRoute("/surveys", () => mount(renderSurveyListView));
addRoute("/surveys/:id", ({ id }) => mount(renderSurveyDetailsView, id));

startRouter();
