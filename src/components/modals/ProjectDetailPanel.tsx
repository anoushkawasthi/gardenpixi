import type { Project } from "../../schemas/projects";
import { selectEnvironmentMode } from "../../store/selectors";
import { useGardenStore } from "../../store/useGardenStore";

type Props = {
  project: Project;
};

export function ProjectDetailPanel({ project }: Props) {
  const environmentMode = useGardenStore(selectEnvironmentMode);
  const isZombie = environmentMode === "zombie";
  const displayName = isZombie ? project.zombieExeName : project.name;

  return (
    <div className="space-y-4 text-sm leading-relaxed text-ui-text/90">
      <header className="space-y-1 border-b border-ui-text/15 pb-3">
        <p className="font-pixel text-[8px] uppercase tracking-wide text-ui-text/60">
          {project.tier} · {project.status}
        </p>
        <h3 className="font-pixel text-xs text-ui-text sm:text-sm">{displayName}</h3>
        {isZombie && (
          <p className="font-body text-xs text-ui-text/70">
            Project: <span className="font-medium text-ui-text/90">{project.name}</span>
          </p>
        )}
      </header>

      <section className="space-y-2">
        <h4 className="font-pixel text-[9px] text-ui-text">Problem</h4>
        <p className="font-body">{project.problem}</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-pixel text-[9px] text-ui-text">Solution</h4>
        <p className="font-body">{project.solution}</p>
      </section>

      {project.keyFeatures.length > 0 && (
        <section className="space-y-2">
          <h4 className="font-pixel text-[9px] text-ui-text">Key features</h4>
          <ul className="list-inside list-disc font-body">
            {project.keyFeatures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="font-pixel text-[9px] text-ui-text">Tech</h4>
        <ul className="flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <li
              key={t}
              className="rounded border border-ui-text/25 bg-ui-text/5 px-2 py-0.5 font-mono text-xs text-ui-text/90"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      {(project.links.live || project.links.github) && (
        <section className="flex flex-wrap gap-3 border-t border-ui-text/15 pt-3">
          {project.links.live && (
            <a
              href={project.links.live}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-[9px] text-accent underline-offset-2 hover:underline"
            >
              Live site
            </a>
          )}
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-pixel text-[9px] text-accent underline-offset-2 hover:underline"
            >
              GitHub
            </a>
          )}
        </section>
      )}
    </div>
  );
}
