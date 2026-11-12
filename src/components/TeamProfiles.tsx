import { safeHref, siteConfig } from "@/lib/site-config";

const disciplines = [
  "Direction & delivery",
  "Frontend engineering",
  "Artificial intelligence",
  "Backend engineering",
];

/** Small work samples illustrate each person's discipline; no decorative skins. */
function Workspace({ index }: { index: number }) {
  if (index === 0)
    return (
      <div className="profile-workspace workspace-plan" aria-hidden="true">
        <div className="workspace-label">
          <span>Project roadmap</span>
          <span>01 → 03</span>
        </div>
        <div className="plan-columns">
          <div>
            <small>Define</small>
            <span>Goals & scope</span>
            <i />
          </div>
          <div>
            <small>Coordinate</small>
            <span>People & priorities</span>
            <i />
          </div>
          <div>
            <small>Deliver</small>
            <span>Review & release</span>
            <i />
          </div>
        </div>
      </div>
    );
  if (index === 1)
    return (
      <div className="profile-workspace workspace-frontend" aria-hidden="true">
        <div className="workspace-label">
          <span>From component to interface</span>
          <span>&lt;/&gt;</span>
        </div>
        <div className="frontend-split">
          <code>
            <span>&lt;Layout&gt;</span>
            <br />
            &nbsp; &lt;Navigation /&gt;
            <br />
            &nbsp; &lt;Content /&gt;
            <br />
            <span>&lt;/Layout&gt;</span>
          </code>
          <div className="interface-preview">
            <div className="interface-nav" />
            <div className="interface-content">
              <i />
              <div>
                <b />
                <b />
                <span>View project ↗</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  if (index === 2)
    return (
      <div className="profile-workspace workspace-ai" aria-hidden="true">
        <div className="workspace-label">
          <span>From question to useful answer</span>
          <span>AI</span>
        </div>
        <div className="ai-pipeline">
          <span>Context</span>
          <i>→</i>
          <strong>Reason</strong>
          <i>→</i>
          <span>Response</span>
        </div>
        <div className="ai-footnote">
          <span>Understand</span>
          <span>Evaluate</span>
          <span>Refine</span>
        </div>
      </div>
    );
  return (
    <div className="profile-workspace workspace-backend" aria-hidden="true">
      <div className="workspace-label">
        <span>Behind every interaction</span>
        <span>API</span>
      </div>
      <div className="backend-route">
        <code>
          <em>GET</em> /api/projects
        </code>
        <span>200 OK</span>
      </div>
      <div className="backend-flow">
        <span>Request</span>
        <i>→</i>
        <span>Service</span>
        <i>→</i>
        <span>Database</span>
      </div>
    </div>
  );
}

export default function TeamProfiles() {
  return (
    <div className="people-grid" aria-label="Octagram team">
      {siteConfig.team
        .filter((person) => person.name.trim())
        .map((person, index) => (
          <article
            className={"person-profile person-profile--" + index}
            key={person.name}
            aria-labelledby={"team-person-" + index}
          >
            <div className="person-discipline">
              <span>{disciplines[index]}</span>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3 id={"team-person-" + index}>{person.name}</h3>
            <p className="person-role">{person.role}</p>
            <Workspace index={index} />
            <p className="person-summary">{person.description}</p>
            <div className="person-bio">
              {person.bio?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {safeHref(person.url) && (
              <a
                className="person-link"
                href={safeHref(person.url)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={person.name + " on LinkedIn"}
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            )}
          </article>
        ))}
    </div>
  );
}
