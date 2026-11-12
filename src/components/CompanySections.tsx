import { SectionBar } from "./BrandPanels";
import WorkCard from "./WorkCard";
import { companyContent as content } from "@/lib/company-content";
import { safeHref, siteConfig, type Project } from "@/lib/site-config";

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
        <h2 id={id}>{section.title}</h2>
        <div className="portfolio-prose">
          {section.paragraphs.map((p) => (
            <p key={p}>{p}</p>
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
      className="content-section values-section"
      id="mission"
      aria-labelledby="mission-title"
    >
      <SectionBar label={section.label} count="OUR PRINCIPLES" />
      <div className="values-layout">
        <div className="values-intro">
          <span className="values-prefix">
            People first.
            <br />
            <span>Purpose always.</span>
          </span>
          <h2 id="mission-title">{section.title}</h2>
          {section.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <ol className="values-list" aria-label={section.principlesIntro}>
          {section.principles.map((principle, index) => (
            <li key={principle.title}>
              <span className="value-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <>
      {project.status && <p className="work-detail-status">{project.status}</p>}
      {(project.overview || [project.description]).map((p) => (
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
    </>
  );
}

export function ProjectStudies() {
  return (
    <div className="selected-work-grid" id="project-list">
      {siteConfig.projects
        .filter((project) => project.status !== "In development")
        .map((project, index) => (
          <WorkCard
            key={project.title}
            title={project.title}
            category={project.industry || project.category || "Software"}
            kind={project.title === "SIX SENSES" ? "clinic" : "fitness"}
            number={String(index + 1).padStart(2, "0")}
            description={project.description}
            href={safeHref(project.url)}
          >
            <ProjectDetails project={project} />
          </WorkCard>
        ))}
    </div>
  );
}

export function InnovationSection() {
  const upcoming = siteConfig.projects.filter(
    (project) => project.status === "In development",
  );
  return (
    <section
      className="content-section development-section"
      id="innovation"
      aria-labelledby="innovation-title"
    >
      <PortfolioIntro section={content.products} id="innovation-title" />
      <div className="development-grid">
        {upcoming.map((project, index) => (
          <WorkCard
            key={project.title}
            id="product-octaclub"
            title={project.title}
            category="Learning platform"
            kind="learning"
            number={String(index + 1).padStart(2, "0")}
            description={project.description}
            development
          >
            <ProjectDetails project={project} />
          </WorkCard>
        ))}
        {content.products.items.map((product, index) => (
          <WorkCard
            key={product.id}
            id={"product-" + product.id}
            title={product.name}
            category={product.industry}
            kind={product.id === "think" ? "think" : "care"}
            number={String(index + upcoming.length + 1).padStart(2, "0")}
            description={product.paragraphs[0]}
            development
          >
            <p className="work-detail-status">{product.status}</p>
            <h4>{product.title}</h4>
            <p>{product.category}</p>
            {product.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <h4>Vision areas</h4>
            <ul>
              {product.visionAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
            <h4>Our ambition</h4>
            <p>{product.ambition}</p>
          </WorkCard>
        ))}
      </div>
    </section>
  );
}

const stageOutputs = [
  "A shared brief",
  "A practical plan",
  "A working product",
  "A release checklist",
  "The next priorities",
];
export function ApproachSection() {
  const section = content.approach;
  return (
    <section
      className="content-section process-section"
      id="approach"
      aria-labelledby="approach-title"
    >
      <SectionBar label={section.label} count="01 — 05" />
      <div className="process-heading">
        <h2 id="approach-title">{section.title}</h2>
        <div>
          {section.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
      <ol className="process-steps">
        {section.stages.map((stage, index) => (
          <li className="process-step" key={stage.number}>
            <div className="process-step-top">
              <span>{stage.number}</span>
              <i aria-hidden="true">↗</i>
            </div>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
            <div className="process-output">
              <small>WHAT WE LEAVE WITH</small>
              <span>{stageOutputs[index]}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="process-closing">
        <span aria-hidden="true">↳</span>
        {section.closing}
      </p>
    </section>
  );
}

export function WhySection() {
  const section = content.whyOctagram;
  return (
    <section
      className="content-section partnership-section"
      id="why-octagram"
      aria-labelledby="why-title"
    >
      <SectionBar label={section.label} />
      <div className="partnership-layout">
        <header className="partnership-statement">
          <span className="partnership-label">YOUR IDEA. OUR COMMITMENT.</span>
          <h2 id="why-title">{section.title}</h2>
          {section.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <a href="#contact">
            Start a conversation <span aria-hidden="true">↗</span>
          </a>
        </header>
        <div className="partnership-promises">
          {section.reasons.map((reason, index) => (
            <article key={reason.title}>
              <span className="promise-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{reason.title}</h3>
              <p>{reason.description}</p>
            </article>
          ))}
        </div>
      </div>
      <p className="partnership-closing">
        {section.closing}
        <span aria-hidden="true">↗</span>
      </p>
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
