export function parseHash(hash) {
  const value = `${hash || ""}`.replace(/^#/, "");

  if (!value || value === "/" || value === "home") {
    return { name: "home" };
  }

  if (value === "projects") {
    return { name: "projects" };
  }

  if (value === "settings") {
    return { name: "settings" };
  }

  if (value.startsWith("project/")) {
    return {
      name: "editor",
      projectId: decodeURIComponent(value.slice("project/".length))
    };
  }

  return { name: "home" };
}

export function routeToHash(route) {
  switch (route.name) {
    case "projects":
      return "#projects";
    case "settings":
      return "#settings";
    case "editor":
      return `#project/${encodeURIComponent(route.projectId)}`;
    case "home":
    default:
      return "#home";
  }
}

export function navigate(route) {
  const nextHash = routeToHash(route);
  if (window.location.hash === nextHash) {
    return;
  }
  window.location.hash = nextHash;
}
