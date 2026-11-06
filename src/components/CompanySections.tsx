import { SectionBar } from "./BrandPanels";
import { companyContent as content } from "@/lib/company-content";
import { safeHref, siteConfig } from "@/lib/site-config";

type SectionCopy = { label: string; title: string; paragraphs: string[] };

export function PortfolioIntro({
  section,
  id,
}: {
  section: SectionCopy;
  id: string;
}) {
  return (
    <>
      <SectionBar label={section.label} />
      <div className="portfolio-intro">
        <div>
          <h2 id={id}>{section.title}</h2>
        </div>
        <div className="portfolio-prose">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </>
  );
}

export function MissionSection() {
  const section = content.mission;
  return (
    <section
      className="portfolio-section content-section mission"
      id="mission"
      aria-labelledby="mission-title"
    >
      <PortfolioIntro section={section} id="mission-title" />
      <p className="section-kicker">{section.principlesIntro}</p>
      <ol className="principles-editorial">
        {section.principles.map((principle, index) => (
          <li className="principle-column" key={principle.title}>
            <span className="principle-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{principle.title}</h3>
            <p>{principle.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProductArtwork({ index, name }: { index: number; name: string }) {
  return (
    <div className="project-visual" aria-hidden="true">
      <svg viewBox="0 0 320 300" fill="none">
        <circle cx="160" cy="150" r="120" stroke="currentColor" opacity=".16" />
        <circle
          cx="160"
          cy="150"
          r="96"
          stroke="currentColor"
          strokeDasharray="2 9"
          opacity=".45"
        />
        {index === 0 ? (
          <>
            <path
              d="M116 178c-36-40-14-100 44-100s80 60 44 100l-16 22h-56z"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity=".08"
            />
            <path
              d="M135 214h50M142 226h36M160 198v-43m0 0-23-24m23 24 23-24"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {[
              [137, 131],
              [183, 131],
              [160, 108],
            ].map(([x, y]) => (
              <circle key={x + y} cx={x} cy={y} r="7" fill="currentColor" />
            ))}
            <path
              d="M160 38v17M82 73l13 13M225 86l13-13M58 150h17M245 150h17"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <rect
              x="96"
              y="86"
              width="128"
              height="128"
              rx="34"
              stroke="currentColor"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity=".08"
            />
            <path
              d="M148 111h24v27h27v24h-27v27h-24v-27h-27v-24h27z"
              fill="currentColor"
            />
            {[0, 1, 2, 3].map((n) => (
              <g key={n} transform={`rotate(${n * 90} 160 150)`}>
                <path d="M160 31v34" stroke="currentColor" opacity=".4" />
                <circle cx="160" cy="35" r="8" fill="currentColor" />
              </g>
            ))}
          </>
        )}
      </svg>
      <div className="project-art-caption">{name}</div>
      <div className="project-art-dots">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function InnovationSection() {
  return (
    <section
      className="portfolio-section content-section"
      id="innovation"
      aria-labelledby="innovation-title"
    >
      <PortfolioIntro section={content.products} id="innovation-title" />
      <div className="project-gallery product-gallery">
        {content.products.items.map((product, index) => (
          <article
            className={`project-showcase product-showcase product-showcase--${index}`}
            id={`product-${product.id}`}
            key={product.id}
          >
            <header className="project-showcase-heading">
              <span className="project-app-icon" aria-hidden="true">
                {index === 0 ? "TH" : "OC"}
              </span>
              <h3>{product.name}</h3>
            </header>
            <p className="project-showcase-description">
              {product.paragraphs[0]}
            </p>
            <div className="project-showcase-meta">{product.industry}</div>
            <p className="product-development-status">{product.status}</p>
            <ProductArtwork index={index} name={product.name} />
            <details className="showcase-details">
              <summary aria-label={`Explore ${product.name}`}>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="showcase-detail-content">
                <h4>{product.title}</h4>
                <p>{product.category}</p>
                {product.paragraphs.slice(1).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <h4>Vision areas</h4>
                <ul>
                  {product.visionAreas.map((area) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
                <h4>Our ambition</h4>
                <p>{product.ambition}</p>
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

function EngineeringGlyph({ index }: { index: number }) {
  const paths = [
    "M12 27 32 15 52 27 32 39z M12 37l20 12 20-12 M32 39v10",
    "M14 16h15v15H14z M35 33h15v15H35z M29 23h13v10 M21 31v10h14",
    "M12 14h40v36H12z M20 24h24 M20 32h16 M20 40h20",
    "M32 9 51 17v14c0 12-19 24-19 24S13 43 13 31V17z M23 31l6 6 13-14",
    "M24 22h-7a10 10 0 0 0 0 20h12 M40 22h7a10 10 0 0 1 0 20H35 M23 32h18",
    "M32 8v10 M32 46v10 M8 32h10 M46 32h10 M15 15l7 7 M42 42l7 7 M15 49l7-7 M42 22l7-7 M32 22l10 10-10 10-10-10z",
  ];
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[index % paths.length]} />
    </svg>
  );
}

export function ApproachSection() {
  const section = content.approach;
  return (
    <section
      className="portfolio-section content-section engineering-section"
      id="approach"
      aria-labelledby="approach-title"
    >
      <SectionBar label={section.label} count="01 — 05" />
      <div className="engineering-layout">
        <div className="engineering-intro">
          <h2 id="approach-title">{section.title}</h2>
          <div className="portfolio-prose">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="engineering-schematic" aria-hidden="true">
            <span>01</span>
            <div className="schematic-track">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span>05</span>
          </div>
          <p className="engineering-principle">{section.closing}</p>
        </div>
        <ol className="engineering-timeline">
          {section.stages.map((stage, index) => (
            <li className="engineering-stage" key={stage.number}>
              <span className="engineering-node" aria-hidden="true">
                {stage.number}
              </span>
              <div className="engineering-stage-body">
                <div className="engineering-stage-heading">
                  <h3>{stage.title}</h3>
                  <EngineeringGlyph index={index} />
                </div>
                <p>{stage.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhySection() {
  const section = content.whyOctagram;
  return (
    <section
      className="portfolio-section content-section commitment-section"
      id="why-octagram"
      aria-labelledby="why-title"
    >
      <SectionBar label={section.label} />
      <header className="commitment-intro">
        <h2 id="why-title">{section.title}</h2>
        <div className="portfolio-prose">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </header>
      <div className="commitment-grid">
        {section.reasons.map((reason, index) => (
          <article
            className={`commitment-card commitment-card--${index}`}
            key={reason.title}
          >
            <div className="commitment-card-top">
              <EngineeringGlyph index={index} />
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="commitment-copy">
              <h3>{reason.title}</h3>
              <p>{reason.description}</p>
            </div>
            {index === 0 && (
              <div className="commitment-structure" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            )}
          </article>
        ))}
      </div>
      <p className="commitment-closing">{section.closing}</p>
    </section>
  );
}

export function ContactContext() {
  return (
    <div className="contact-context">
      <p>{content.contact.paragraphs[0]}</p>
      <div className="contact-socials">
        <a
          href="https://wa.me/962780668491"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Octagram on WhatsApp"
          title="WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 20.6l1.3-4.8a8.5 8.5 0 1 1 16.2-4Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="m8.5 7.3 1.3 2.5-1 1.1c.7 1.6 1.8 2.7 3.5 3.5l1.2-1 2.5 1.2c.1 1.5-1 2.2-2.2 2.1-3.4-.4-6.6-3.5-7-6.8-.1-1.3.5-2.4 1.7-2.6Z"
              fill="currentColor"
            />
          </svg>
        </a>
        <a
          href={content.contact.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Octagram on Instagram"
          title="Instagram"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="3.5"
              y="3.5"
              width="17"
              height="17"
              rx="5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle
              cx="12"
              cy="12"
              r="4"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="17.5" cy="6.8" r="1" fill="currentColor" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function ProjectArtwork({ index }: { index: number }) {
  return (
    <div
      className={`project-visual project-visual--${index}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 300" fill="none">
        <circle cx="160" cy="150" r="124" stroke="currentColor" opacity=".15" />
        <circle
          cx="160"
          cy="150"
          r="102"
          stroke="currentColor"
          strokeDasharray="2 9"
          opacity=".4"
        />
        {index === 0 ? (
          <>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <rect
                key={n}
                x={79 + n * 28}
                y={95 - Math.sin(n * 0.8) * 26}
                width="22"
                height={110 + Math.sin(n * 0.8) * 52}
                rx="11"
                fill="currentColor"
                opacity={0.25 + n * 0.12}
              />
            ))}
            <path
              d="M38 154h48l16-30 24 62 28-87 30 67 20-28 14 16h64"
              stroke="var(--text-primary)"
              strokeWidth="2"
            />
          </>
        ) : index === 1 ? (
          <>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <g key={n} transform={`rotate(${n * 45} 160 150)`}>
                <path d="M160 150V62" stroke="currentColor" opacity=".3" />
                <rect
                  x="146"
                  y="43"
                  width="28"
                  height="28"
                  rx="9"
                  fill="currentColor"
                  opacity={0.3 + n * 0.08}
                />
              </g>
            ))}
            <rect
              x="117"
              y="107"
              width="86"
              height="86"
              rx="26"
              fill="var(--page-bg)"
              stroke="currentColor"
            />
            <text
              x="160"
              y="162"
              textAnchor="middle"
              fill="currentColor"
              fontSize="32"
              fontFamily="monospace"
            >
              OC
            </text>
          </>
        ) : (
          <>
            <circle
              cx="160"
              cy="150"
              r="82"
              stroke="currentColor"
              strokeWidth="18"
              opacity=".15"
            />
            <circle
              cx="160"
              cy="150"
              r="82"
              stroke="currentColor"
              strokeWidth="18"
              strokeDasharray="365 151"
              transform="rotate(-90 160 150)"
              strokeLinecap="round"
            />
            <path
              d="M121 150h78M121 130v40M109 138v24M199 130v40M211 138v24"
              stroke="var(--text-primary)"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      <div className="project-art-caption">
        {["SIX SENSES", "OCTACLUB", "THAAERFIT"][index]}
      </div>
      <div className="project-art-dots">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function ProjectStudies() {
  return (
    <>
      {siteConfig.projects.map((project, index) => {
        const href = safeHref(project.url);
        const paragraphs = project.overview || [project.description];
        return (
          <article
            className={`project-card project-showcase project-showcase--${index}`}
            key={project.title}
          >
            <header className="project-showcase-heading">
              <span className="project-app-icon" aria-hidden="true">
                {["6S", "OC", "TF"][index]}
              </span>
              <h3>{project.title}</h3>
            </header>
            <p className="project-showcase-description">
              {project.description}
            </p>
            <div className="project-showcase-meta">
              {project.subtitle || project.title}
            </div>
            <ProjectArtwork index={index} />
            <details className="showcase-details">
              <summary aria-label={`Explore ${project.title}`}>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="showcase-detail-content">
                {project.status && (
                  <p className="showcase-status">{project.status}</p>
                )}
                {paragraphs.slice(1).map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {(project.capabilities || project.focus)?.length ? (
                  <>
                    <h4>{project.capabilitiesLabel || "Project focus"}</h4>
                    <ul>
                      {(project.capabilities || project.focus || []).map(
                        (item) => (
                          <li key={item}>{item}</li>
                        ),
                      )}
                    </ul>
                  </>
                ) : null}
                {project.engineering?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {project.digitalExperience?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {project.value?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {project.client && <p>{project.client}</p>}
                {href && (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    Visit {new URL(href, siteConfig.siteUrl).hostname}{" "}
                  </a>
                )}
              </div>
            </details>
          </article>
        );
      })}
    </>
  );
}
