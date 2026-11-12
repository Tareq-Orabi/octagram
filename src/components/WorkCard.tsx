import type { ReactNode } from "react";

type WorkKind = "clinic" | "fitness" | "learning" | "think" | "care";

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
      <div className="work-card-copy">
        <div className="work-identity">
          <span className="work-mark" aria-hidden="true">
            {
              {
                clinic: "6S",
                fitness: "TF",
                learning: "Oc",
                think: "Th",
                care: "Oc+",
              }[kind]
            }
          </span>
          <h3>{title}</h3>
        </div>
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
