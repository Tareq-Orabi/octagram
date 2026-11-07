"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

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

/** A local desktop metaphor; all project text remains server-rendered children. */
export default function ProjectDesktop({
  projects,
}: {
  projects: DesktopProject[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const desktop = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dock = useRef<(HTMLButtonElement | null)[]>([]);
  const activated = useRef(false);
  const previous = useRef(0);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    left: number;
    top: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);
  const position = useRef({ x: 0, y: 0 });
  const visible = active !== null && !minimized;
  const project = active === null ? null : projects[active];

  const resetPosition = () => {
    position.current = { x: 0, y: 0 };
    windowRef.current?.style.setProperty("--window-x", "0px");
    windowRef.current?.style.setProperty("--window-y", "0px");
  };
  const launch = (index: number) => {
    activated.current = true;
    previous.current = index;
    setActive(index);
    setMinimized(false);
    resetPosition();
  };
  const close = () => {
    setActive(null);
    setMinimized(false);
    setMaximized(false);
    resetPosition();
  };

  useLayoutEffect(() => {
    if (!activated.current) return;
    (visible ? closeButton.current : dock.current[previous.current])?.focus({
      preventScroll: true,
    });
  }, [active, minimized, visible]);
  useLayoutEffect(() => {
    if (active !== null)
      windowRef.current
        ?.querySelector<HTMLElement>(`#mac-project-${active}`)
        ?.scrollTo({ top: 0 });
  }, [active]);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(resetPosition);
    if (desktop.current) observer.observe(desktop.current);
    return () => observer.disconnect();
  }, []);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (
      maximized ||
      event.button !== 0 ||
      !desktop.current ||
      !windowRef.current ||
      desktop.current.clientWidth < 700 ||
      (event.target as HTMLElement).closest("button, a")
    )
      return;
    const bounds = desktop.current.getBoundingClientRect();
    const frame = windowRef.current.getBoundingClientRect();
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: position.current.x,
      top: position.current.y,
      minX: bounds.left + 8 - frame.left + position.current.x,
      maxX: bounds.right - 8 - frame.right + position.current.x,
      minY: bounds.top + 38 - frame.top + position.current.y,
      maxY: bounds.bottom - 94 - frame.bottom + position.current.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveWindow = (event: PointerEvent<HTMLDivElement>) => {
    const p = drag.current;
    if (!p || p.pointer !== event.pointerId) return;
    position.current = {
      x: Math.max(p.minX, Math.min(p.maxX, p.left + event.clientX - p.x)),
      y: Math.max(p.minY, Math.min(p.maxY, p.top + event.clientY - p.y)),
    };
    windowRef.current?.style.setProperty(
      "--window-x",
      `${position.current.x}px`,
    );
    windowRef.current?.style.setProperty(
      "--window-y",
      `${position.current.y}px`,
    );
  };

  return (
    <div
      ref={desktop}
      className="mac-desktop"
      aria-label="Octagram project desktop"
    >
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

      <div className="mac-menu-bar">
        <div className="mac-menu-left">
          <img src="/assets/brand/logo.svg" width="17" height="17" alt="" />
          <span className="mac-menu-brand">Octagram</span>
          <button
            type="button"
            onClick={() => {
              if (active !== null) setMinimized(true);
            }}
          >
            Projects
          </button>
          <span className="mac-menu-context">
            {visible ? project?.title : "Portfolio"}
          </span>
        </div>
        <div className="mac-menu-right">
          <span>{projects.length} apps</span>
          <svg
            viewBox="0 0 24 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3 6q9-8 18 0M6 9q6-5 12 0M9 12q3-2 6 0" />
            <circle cx="12" cy="15" r=".8" fill="currentColor" />
          </svg>
          <span className="mac-battery" aria-hidden="true">
            <i />
          </span>
        </div>
      </div>

      <div
        className="mac-desktop-content"
        inert={visible}
        aria-hidden={visible}
      >
        <div className="mac-desktop-welcome">
          <p>THE OCTAGRAM COLLECTION</p>
          <div>
            Ideas
            <br />
            Taking shape
          </div>
          <span>Open a project to explore</span>
        </div>
        <div className="mac-desktop-apps" aria-label="Project applications">
          {projects.map((app, index) => (
            <button
              type="button"
              key={app.title}
              className="mac-desktop-app"
              onClick={() => launch(index)}
              aria-label={`Open ${app.title}`}
              aria-haspopup="dialog"
            >
              <AppIcon index={app.icon} />
              <span className="mac-desktop-app-name">{app.title}</span>
              {app.future && <small>In development</small>}
            </button>
          ))}
        </div>
        <div className="mac-desktop-note">
          ENGINEERED IN JORDAN <span>Projects and ideas in development</span>
        </div>
      </div>

      <div
        ref={windowRef}
        className="mac-window"
        data-maximized={maximized}
        hidden={!visible}
        role="dialog"
        aria-modal="false"
        aria-label={project ? `${project.title} project` : "Project"}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        <div
          className="mac-window-titlebar"
          onPointerDown={startDrag}
          onPointerMove={moveWindow}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <div className="mac-traffic-lights">
            <button
              ref={closeButton}
              type="button"
              className="mac-close"
              aria-label="Close project window"
              onClick={close}
            >
              <span />
            </button>
            <button
              type="button"
              className="mac-minimize"
              aria-label="Minimize project window"
              onClick={() => setMinimized(true)}
            >
              <span />
            </button>
            <button
              type="button"
              className="mac-maximize"
              aria-label={
                maximized ? "Restore window size" : "Maximize project window"
              }
              aria-pressed={maximized}
              onClick={() => {
                resetPosition();
                setMaximized(!maximized);
              }}
            >
              <span />
            </button>
          </div>
          <span className="mac-window-title">{project?.title}</span>
          <span className="mac-window-caption">Project overview</span>
        </div>
        <div className="mac-window-body">
          <nav className="mac-window-sidebar" aria-label="Switch project">
            <span className="mac-sidebar-label">Projects</span>
            {projects.map((app, index) => (
              <div key={app.title}>
                {app.future && !projects[index - 1]?.future && (
                  <span className="mac-sidebar-label mac-sidebar-future">
                    In development
                  </span>
                )}
                <button
                  type="button"
                  aria-current={index === active ? "page" : undefined}
                  onClick={() => launch(index)}
                >
                  <AppIcon index={app.icon} />
                  <span>{app.title}</span>
                </button>
              </div>
            ))}
            <div className="mac-sidebar-brand">
              <img src="/assets/brand/logo.svg" alt="" width="22" height="22" />
              <span>
                Built by
                <br />
                <strong>Octagram</strong>
              </span>
            </div>
          </nav>
          <div className="mac-app-container">
            <div className="mac-app-toolbar">
              <span>
                {project?.future ? "Future initiative" : project?.industry}
              </span>
              {project?.href && (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open website
                </a>
              )}
            </div>
            {projects.map((app, index) => (
              <div
                key={app.title}
                id={`mac-project-${index}`}
                className="mac-app-page"
                hidden={active !== index}
                tabIndex={0}
                role="region"
                aria-label={`${app.title} details`}
              >
                <div className="mac-app-hero">
                  <AppIcon index={app.icon} />
                  <div>
                    <span className="mac-app-eyebrow">
                      {app.future ? "IN DEVELOPMENT" : "OCTAGRAM / PROJECT"}
                    </span>
                    <h3>{app.title}</h3>
                    <p>{app.subtitle}</p>
                  </div>
                </div>
                <div className="mac-app-facts">
                  {app.category && <span>{app.category}</span>}
                  {app.status && (
                    <span className="mac-status">{app.status}</span>
                  )}
                </div>
                <div className="mac-app-description">
                  <h4>About the project</h4>
                  <p>{app.description}</p>
                  {app.details}
                  {app.href && (
                    <p className="mac-project-address">
                      <a
                        href={app.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {new URL(app.href, "https://octagramjo.com").hostname}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <nav className="mac-dock" aria-label="Project dock">
        {projects.map((app, index) => (
          <button
            key={app.title}
            type="button"
            ref={(node) => {
              dock.current[index] = node;
            }}
            className={`mac-dock-app${app.future && !projects[index - 1]?.future ? " mac-dock-future" : ""}`}
            aria-label={`${active === index && minimized ? "Restore" : "Open"} ${app.title} from Dock`}
            aria-haspopup="dialog"
            aria-expanded={active === index && !minimized}
            onClick={() => launch(index)}
          >
            <span className="mac-dock-tooltip">
              {app.title}
              {app.future ? " · In development" : ""}
            </span>
            <AppIcon index={app.icon} />
            <i className="mac-running-dot" data-running={active === index} />
          </button>
        ))}
      </nav>
      <noscript>
        <div className="mac-nojs">
          {projects.map((app) => (
            <details key={app.title}>
              <summary>{app.title}</summary>
              <p>{app.description}</p>
              {app.details}
              {app.href && <a href={app.href}>Open website</a>}
            </details>
          ))}
        </div>
      </noscript>
    </div>
  );
}
