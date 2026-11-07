import ProjectDesktop, { type DesktopProject } from "./ProjectDesktop";
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

export function ProjectStudies() {
  const projects: DesktopProject[] = siteConfig.projects.map(
    (project, index) => ({
      icon: index,
      future: project.status === "In development",
      title: project.title,
      subtitle: project.subtitle,
      category: project.category,
      industry: project.industry,
      status: project.status,
      description: project.description,
      href: safeHref(project.url),
      details: (
        <>
          {(project.overview || [])
            .filter((p) => p !== project.description)
            .map((p) => (
              <p key={p}>{p}</p>
            ))}
          {(project.capabilities || project.focus)?.length ? (
            <>
              <h4>{project.capabilitiesLabel || "Project focus"}</h4>
              <ul>
                {(project.capabilities || project.focus || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {project.engineering?.length ? (
            <>
              <h4>Engineering</h4>
              {project.engineering.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </>
          ) : null}
          {project.digitalExperience?.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {project.value?.length ? (
            <>
              <h4>Purpose</h4>
              {project.value.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </>
          ) : null}
          {project.client && <p>{project.client}</p>}
        </>
      ),
    }),
  );
  projects.push(
    ...content.products.items.map((product, index) => ({
      icon: index + 3,
      title: product.name,
      subtitle: product.title,
      industry: product.industry,
      category: product.category,
      status: product.status,
      description: product.paragraphs[0],
      future: true,
      details: (
        <>
          {product.paragraphs.slice(1).map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h4>Areas we are exploring</h4>
          <ul>
            {product.visionAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
          <h4>What we hope to make easier</h4>
          <p>{product.ambition}</p>
        </>
      ),
    })),
  );
  projects.sort(
    (a, b) => Number(Boolean(a.future)) - Number(Boolean(b.future)),
  );
  return <ProjectDesktop projects={projects} />;
}
