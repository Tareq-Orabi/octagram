"use client";

import { useRef, type ReactNode } from "react";

export interface GalleryProject {
  icon: number;
  title: string;
  subtitle?: string;
  category?: string;
  industry?: string;
  description: string;
  status?: string;
  href?: string;
  future?: boolean;
  details: ReactNode;
}

function ProjectIcon({ index }: { index: number }) {
  return (
    <span className="project-mark" aria-hidden="true">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {index === 0 ? (
          <>
            <rect x="14" y="13" width="36" height="40" rx="10" />
            <path d="M24 13v-3h16v3M24 32h16M32 24v16" />
          </>
        ) : index === 1 ? (
          <>
            <path d="M32 20c-7-6-16-5-22-3v31c8-3 15-2 22 3 7-5 14-6 22-3V17c-6-2-15-3-22 3ZM32 20v31" />
            <path d="M17 27c3-1 5 0 8 1M39 28c3-1 5-2 8-1" />
          </>
        ) : index === 2 ? (
          <>
            <path d="M24 32h16M12 26v12M52 26v12" />
            <rect x="17" y="19" width="7" height="26" rx="3" />
            <rect x="40" y="19" width="7" height="26" rx="3" />
          </>
        ) : index === 3 ? (
          <>
            <path d="M32 14c-4-6-14-3-14 5-8 1-10 12-4 17-4 8 3 15 10 13 2 5 8 3 8-1V14Zm0 0c4-6 14-3 14 5 8 1 10 12 4 17 4 8-3 15-10 13-2 5-8 3-8-1" />
            <path d="M21 25c7 0 7 9 2 11M43 25c-7 0-7 9-2 11M23 43h9M32 20h8" />
          </>
        ) : (
          <>
            <path d="M25 11h14v14h14v14H39v14H25V39H11V25h14Z" />
            <path d="M25 32h14" opacity=".5" />
          </>
        )}
      </svg>
    </span>
  );
}

function ProjectArtwork({ index }: { index: number }) {
  return (
    <div className="project-artwork" aria-hidden="true">
      <svg viewBox="0 0 420 180" fill="none">
        {index === 0 ? (
          <g stroke="currentColor" strokeWidth="1.5">
            <rect
              x="77"
              y="27"
              width="266"
              height="126"
              rx="12"
              opacity=".35"
            />
            <path d="M77 55h266M140 55v98" opacity=".35" />
            <path
              d="M96 42h28m-28 34h25m-25 14h19m-19 14h25"
              strokeLinecap="round"
              opacity=".6"
            />
            <rect
              x="156"
              y="70"
              width="72"
              height="66"
              rx="7"
              fill="currentColor"
              fillOpacity=".1"
            />
            <path
              d="M192 87v24m-12-12h24"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M250 90h70m-70 16h54m-54 16h61"
              strokeLinecap="round"
              opacity=".6"
            />
          </g>
        ) : (
          <g stroke="currentColor" strokeWidth="1.5">
            <path
              d="M94 139h232M94 39v100m0-33h232M94 73h232M94 39h232"
              opacity=".25"
            />
            <path
              d="M105 118l52-19 47 7 51-38 62-21"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M105 118l52-19 47 7 51-38 62-21v92H105Z"
              fill="currentColor"
              fillOpacity=".13"
              stroke="none"
            />
            <circle cx="317" cy="47" r="6" fill="currentColor" />
            <circle cx="255" cy="68" r="4" fill="currentColor" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default function ProjectGallery({
  projects,
}: {
  projects: GalleryProject[];
}) {
  const opener = useRef<HTMLButtonElement | null>(null);
  const featured = projects.filter((project) => !project.future);
  const upcoming = projects.filter((project) => project.future);

  function openProject(icon: number, button: HTMLButtonElement) {
    const dialog = document.getElementById(`project-details-${icon}`);
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
    opener.current = button;
    dialog.showModal();
    dialog.querySelector(".project-detail-body")?.scrollTo({ top: 0 });
  }

  return (
    <>
      <div className="project-browser">
        <div className="project-featured">
          {featured.map((project) => (
            <article
              key={project.title}
              className={`project-feature project-tone-${project.icon}`}
            >
              <ProjectArtwork index={project.icon} />
              <div className="project-feature-copy">
                <div className="project-meta">
                  <span>{project.industry}</span>
                  {project.status && <span>{project.status}</span>}
                </div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <button
                  type="button"
                  className="project-open"
                  aria-label={`View ${project.title} project`}
                  aria-haspopup="dialog"
                  onClick={(event) =>
                    openProject(project.icon, event.currentTarget)
                  }
                >
                  View project <span aria-hidden="true">+</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        <section
          className="project-upcoming"
          aria-labelledby="project-upcoming-title"
        >
          <h3 id="project-upcoming-title">In development</h3>
          <ul>
            {upcoming.map((project) => (
              <li
                key={project.title}
                className={`project-tone-${project.icon}`}
              >
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`View ${project.title} project`}
                  onClick={(event) =>
                    openProject(project.icon, event.currentTarget)
                  }
                >
                  <ProjectIcon index={project.icon} />
                  <span>
                    <strong>{project.title}</strong>
                    <small>{project.subtitle}</small>
                  </span>
                  <span className="project-row-action">
                    <span>View project</span>
                    <b aria-hidden="true">+</b>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {projects.map((project) => (
        <dialog
          key={project.title}
          id={`project-details-${project.icon}`}
          className={`project-detail project-tone-${project.icon}`}
          aria-labelledby={`project-title-${project.icon}`}
          onClose={() => opener.current?.focus({ preventScroll: true })}
        >
          <header className="project-detail-bar">
            <span>PROJECT DETAILS</span>
            <form method="dialog">
              <button type="submit" autoFocus>
                Close <span aria-hidden="true">×</span>
              </button>
            </form>
          </header>
          <div
            className="project-detail-body"
            tabIndex={0}
            role="region"
            aria-label="Project description"
          >
            <div className="project-detail-heading">
              <ProjectIcon index={project.icon} />
              <div>
                <h3 id={`project-title-${project.icon}`}>{project.title}</h3>
                <p>{project.subtitle}</p>
              </div>
            </div>
            <div className="project-meta">
              <span>{project.industry}</span>
              <span>{project.category}</span>
              {project.status && <span>{project.status}</span>}
            </div>
            <p className="project-detail-lead">{project.description}</p>
            {project.details}
          </div>
          {project.href && (
            <footer className="project-detail-links">
              <a href={project.href} target="_blank" rel="noopener noreferrer">
                Visit website
              </a>
            </footer>
          )}
        </dialog>
      ))}
      <noscript>
        <style>{".project-browser { display: none }"}</style>
        {projects.map((project) => (
          <details key={project.title} className="project-fallback">
            <summary>
              {project.title}
              {project.status ? ` · ${project.status}` : ""}
            </summary>
            <p>{project.description}</p>
            {project.details}
            {project.href && <a href={project.href}>Visit website</a>}
          </details>
        ))}
      </noscript>
    </>
  );
}
