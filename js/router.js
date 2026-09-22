const routes = [];

export function addRoute(pattern, handler) {
  // pattern like "/surveys" or "/surveys/:id"
  const paramNames = [];
  const regexStr = pattern
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment;
    })
    .join("/");
  routes.push({ regex: new RegExp(`^${regexStr}$`), paramNames, handler });
}

function resolve() {
  const hash = window.location.hash.replace(/^#/, "") || "/surveys";
  for (const route of routes) {
    const match = hash.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = match[i + 1]));
      route.handler(params);
      return;
    }
  }
  navigate("/surveys");
}

export function navigate(path) {
  window.location.hash = path;
}

export function startRouter() {
  window.addEventListener("hashchange", resolve);
  resolve();
}
