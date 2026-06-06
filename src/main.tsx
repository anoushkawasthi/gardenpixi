import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { projectsSchema } from "./schemas/projects";
import projects from "./content/projects.json";
import App from "./App";
import "./styles/index.css";

if (import.meta.env.DEV) {
  projectsSchema.parse(projects);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
