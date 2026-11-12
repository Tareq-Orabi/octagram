import type { ReactNode } from "react";

type WorkKind = "clinic" | "fitness" | "learning" | "think" | "care";

function WorkPreview({ kind }: { kind: WorkKind }) {
  if (kind === "clinic")
    return (
      <div className="work-preview clinic-preview" aria-hidden="true">
        <div className="preview-caption">Care, connected.</div>
        <div className="clinic-window">
          <div className="clinic-sidebar">
            <b>6S</b>
            <span>Overview</span>
            <span>Patients</span>
            <span>Appointments</span>
            <span>Reports</span>
          </div>
          <div className="clinic-main">
            <small>DAILY WORKSPACE</small>
            <strong>A clearer day.</strong>
            <div className="clinic-tabs">
              <span>Schedule</span>
              <span>Patient care</span>
            </div>
            {["Appointments", "Treatment sessions", "Follow-ups"].map(
              (label, i) => (
                <div className="clinic-row" key={label}>
                  <i>{"0" + (i + 1)}</i>
                  <span>{label}</span>
                  <b>→</b>
                </div>
              ),
            )}
          </div>
        </div>
        <span className="preview-note">Workflow illustration</span>
      </div>
    );
  if (kind === "fitness")
    return (
      <div className="work-preview fitness-preview" aria-hidden="true">
        <div className="preview-caption">Built for progress.</div>
        <div className="fitness-window">
          <div className="fitness-wordmark">
            THAAER<span>FIT</span>
          </div>
          <div className="fitness-layout">
            <div>
              <small>STRENGTH · NUTRITION</small>
              <strong>
                Show up.
                <br />
                Move forward.
              </strong>
              <span className="fitness-action">Find your next step ↗</span>
            </div>
            <div className="fitness-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="fitness-bottom">
            <span>Train with purpose</span>
            <span>01 — ∞</span>
          </div>
        </div>
        <span className="preview-note">Brand illustration</span>
      </div>
    );
  return (
    <div
      className={"product-symbol product-symbol--" + kind}
      aria-hidden="true"
    >
      {kind === "learning" ? (
        <>
          <span className="product-monogram">
            Oc<span>↗</span>
          </span>
          <div className="product-symbol-line">LEARN / CONNECT / GROW</div>
        </>
      ) : kind === "think" ? (
        <>
          <span className="product-monogram">
            Th<span>_</span>
          </span>
          <div className="product-symbol-line">A LITTLE MORE POSSIBLE</div>
        </>
      ) : (
        <>
          <span className="product-monogram">
            Oc<span>+</span>
          </span>
          <div className="product-symbol-line">PEOPLE / CARE / CONNECTION</div>
        </>
      )}
    </div>
  );
}

export default function WorkCard({
  id,
  title,
  category,
  description,
  kind,
  number,
  development = false,
  href,
  children,
}: {
  id?: string;
  title: string;
  category: string;
  description: string;
  kind: WorkKind;
  number: string;
  development?: boolean;
  href?: string;
  children: ReactNode;
}) {
  return (
    <article
      id={id}
      className={
        "work-card work-card--" +
        kind +
        (development ? " work-card--development" : "")
      }
      aria-label={title + " project"}
    >
      <div className="work-card-index">
        <span>
          {number} / {category}
        </span>
        <span className="work-status">
          {development ? "In development" : "Selected work"}
        </span>
      </div>
      <WorkPreview kind={kind} />
      <div className="work-card-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <details className="work-details">
          <summary>
            Explore project <span aria-hidden="true">+</span>
          </summary>
          <div className="work-details-body">{children}</div>
        </details>
        {href && (
          <a
            className="work-site-link"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={"Visit " + title + " website"}
          >
            Visit website <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
