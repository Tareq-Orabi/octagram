import { safeHref, siteConfig, type TeamMember } from "@/lib/site-config";

const workspaceLabels = {
  terminal: "Terminal",
  design: "Interface studio",
  ai: "AI workspace",
} as const;

function WorkspacePreview({
  workspace,
  role,
}: Pick<TeamMember, "workspace" | "role">) {
  if (workspace === "terminal") {
    const backend = role === "Backend Lead";
    return (
      <div className="profile-console" aria-hidden="true">
        <code>
          <b>$</b> {backend ? "cat backend.yml" : "cat project.yml"}
        </code>
        <code>
          <span>{backend ? "systems" : "scope"}</span>:{" "}
          {backend ? "APIs · databases" : "goals · requirements"}
        </code>
        <code>
          <span>{backend ? "focus" : "delivery"}</span>:{" "}
          {backend ? "reliable services" : "planning · coordination"}
        </code>
      </div>
    );
  }
  if (workspace === "design") {
    return (
      <div className="profile-design-preview" aria-hidden="true">
        <span>FRAME / 01</span>
        <svg viewBox="0 0 230 62" fill="none" stroke="currentColor">
          <rect
            x="2"
            y="2"
            width="226"
            height="58"
            rx="4"
            strokeDasharray="3 3"
            opacity=".65"
          />
          <path
            d="M15 15h45m-45 12h61m-61 7h48m-48 12h28"
            strokeLinecap="round"
          />
          <rect
            x="113"
            y="13"
            width="44"
            height="36"
            rx="3"
            fill="currentColor"
            fillOpacity=".14"
          />
          <rect x="165" y="13" width="49" height="15" rx="3" />
          <rect x="165" y="34" width="49" height="15" rx="3" />
          <path
            d="M2 2h5v5H2zm221 0h5v5h-5zM2 55h5v5H2zm221 0h5v5h-5z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }
  if (workspace === "ai") {
    return (
      <div className="profile-ai-preview" aria-hidden="true">
        <span>Input</span>
        <i />
        <span>Model</span>
        <i />
        <span>Output</span>
      </div>
    );
  }
  return null;
}

export default function TeamProfiles() {
  return (
    <div className="team-windows" aria-label="Octagram team">
      {siteConfig.team
        .filter((person) => person.name.trim())
        .map((person, index) => {
          const href = safeHref(person.url);
          const workspaceLabel = person.workspace
            ? workspaceLabels[person.workspace]
            : "Profile";
          return (
            <article
              className={`team-window profile-${person.workspace || "basic"}`}
              aria-labelledby={`team-person-${index}`}
              key={person.name}
            >
              <header className="profile-bar">
                <span>{workspaceLabel}</span>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </header>
              <div className="profile-content">
                <div className="profile-name">
                  <h3 id={`team-person-${index}`}>{person.name}</h3>
                  <p>{person.role}</p>
                </div>
                <WorkspacePreview
                  workspace={person.workspace}
                  role={person.role}
                />
                <p className="profile-summary">{person.description}</p>
                <div className="team-window-body">
                  {person.bio?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {href && (
                  <a
                    className="profile-link"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${person.name} on LinkedIn`}
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </article>
          );
        })}
    </div>
  );
}
