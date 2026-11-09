"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export interface DesktopProject {
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

function AppIcon({ index }: { index: number }) {
  return (
    <span className={`mac-app-icon mac-app-icon--${index}`} aria-hidden="true">
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

/** One Finder-style window, with a single route into and out of each project. */
export default function ProjectDesktop({
  projects,
}: {
  projects: DesktopProject[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const launcher = useRef<(HTMLButtonElement | null)[]>([]);
  const back = useRef<HTMLButtonElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const previous = useRef<number | null>(null);
  const project = active === null ? null : projects[active];
  const open = (index: number) => {
    previous.current = index;
    setActive(index);
  };
  const close = () => setActive(null);
  useLayoutEffect(() => {
    if (previous.current === null) return;
    page.current?.scrollTo({ top: 0 });
    (active === null
      ? launcher.current[previous.current]
      : back.current
    )?.focus({ preventScroll: true });
  }, [active]);

  return (
    <div className="mac-desktop" aria-label="Octagram projects">
      <div className="mac-wallpaper" aria-hidden="true">
        <svg viewBox="0 0 1400 850" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="mac-wave-teal" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#a3d0b9" />
              <stop offset=".4" stopColor="#41978b" />
              <stop offset="1" stopColor="#102e29" />
            </linearGradient>
            <linearGradient id="mac-wave-warm" x1="0" y1="0" x2=".6" y2="1">
              <stop stopColor="#fdaa7d" />
              <stop offset=".46" stopColor="#c6764f" />
              <stop offset="1" stopColor="#3b2921" />
            </linearGradient>
            <linearGradient id="mac-wave-deep" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#657a49" />
              <stop offset=".45" stopColor="#17493e" />
              <stop offset="1" stopColor="#071b19" />
            </linearGradient>
          </defs>
          <path
            d="M-160 920C-130 420 310 620 470 300S1040-190 1460 70V940Z"
            fill="url(#mac-wave-deep)"
          />
          <path
            d="M-90 890C10 420 310 770 560 450S960 180 1190 270 1430 210 1480 100V900Z"
            fill="url(#mac-wave-teal)"
          />
          <path
            d="M-80 900C0 670 210 640 440 760S820 860 1020 510 1310 320 1480 400V900Z"
            fill="url(#mac-wave-warm)"
          />
          <path
            d="M-100 970C170 610 470 1060 800 800S1160 590 1510 680V1000Z"
            fill="url(#mac-wave-deep)"
          />
        </svg>
      </div>

      <div className="mac-menu-bar" aria-hidden="true">
        <div className="mac-menu-left">
          <img src="/assets/brand/logo.svg" width="17" height="17" alt="" />
          <strong>Octagram</strong>
          <span>Projects</span>
        </div>
        <span className="mac-menu-right">Made in Jordan</span>
      </div>
      <div
        className="mac-window"
        onKeyDown={(event) => {
          if (event.key === "Escape" && active !== null) {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        <div className="mac-window-titlebar">
          <div className="mac-traffic-lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="mac-window-title">
            {project ? project.title : "Projects"}
          </div>
          <span className="mac-window-caption">
            {project ? "Project details" : `${projects.length} projects`}
          </span>
        </div>
        <div className="mac-app-toolbar">
          {project ? (
            <button
              ref={back}
              type="button"
              className="mac-back"
              onClick={close}
            >
              All projects
            </button>
          ) : (
            <p>Select a project to explore</p>
          )}
          {project?.href && (
            <a href={project.href} target="_blank" rel="noopener noreferrer">
              Visit website
            </a>
          )}
        </div>
        <div
          ref={page}
          className="mac-window-content"
          tabIndex={0}
          role="region"
          aria-label={
            project ? `${project.title} details` : "Project collection"
          }
        >
          <div className="mac-collection" hidden={active !== null}>
            {[false, true].map((future) => (
              <section
                key={String(future)}
                className="mac-project-group"
                aria-label={future ? "In development" : "Selected work"}
              >
                <h3>{future ? "In development" : "Selected work"}</h3>
                <div className="mac-app-grid">
                  {projects.map(
                    (app, index) =>
                      Boolean(app.future) === future && (
                        <button
                          key={app.title}
                          ref={(node) => {
                            launcher.current[index] = node;
                          }}
                          type="button"
                          className="mac-launcher"
                          onClick={() => open(index)}
                          aria-label={`Open ${app.title}`}
                        >
                          <AppIcon index={app.icon} />
                          <span className="mac-launcher-name">{app.title}</span>
                          <span className="mac-launcher-type">
                            {app.subtitle || app.industry}
                          </span>
                        </button>
                      ),
                  )}
                </div>
              </section>
            ))}
          </div>
          {projects.map((app, index) => (
            <article
              key={app.title}
              hidden={active !== index}
              className="mac-app-page"
            >
              <header className="mac-app-hero">
                <AppIcon index={app.icon} />
                <div>
                  <h3>{app.title}</h3>
                  <p>{app.subtitle}</p>
                </div>
              </header>
              <div className="mac-app-facts">
                {app.category && <span>{app.category}</span>}
                {app.status && <span className="mac-status">{app.status}</span>}
              </div>
              <div className="mac-app-description">
                <p className="mac-project-intro">{app.description}</p>
                {app.details}
              </div>
            </article>
          ))}
        </div>
        <div className="mac-window-status" aria-hidden="true">
          <span>
            {project
              ? project.future
                ? "In development"
                : project.industry
              : "Octagram collection"}
          </span>
          <span>{project ? "Press Esc to return" : "Click once to open"}</span>
        </div>
      </div>
      <noscript>
        <div className="mac-nojs">
          {projects.map((app) => (
            <details key={app.title}>
              <summary>{app.title}</summary>
              <p>{app.subtitle}</p>
              {app.status && <p>{app.status}</p>}
              <p>{app.description}</p>
              {app.details}
              {app.href && <a href={app.href}>Visit website</a>}
            </details>
          ))}
        </div>
      </noscript>
    </div>
  );
}
