import { SectionBar } from "./BrandPanels";
import AssemblyProcess from "./ScrollProcess";
import PartnershipScene from "./PartnershipScene";
import PrinciplesScene from "./PrinciplesScene";
import { companyContent as content } from "@/lib/company-content";
import UpcomingProjects from "./UpcomingProjects";
import ExploreText from "./ExploreText";

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
          <h2 id={id}><ExploreText>{section.title}</ExploreText></h2>
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
      <PrinciplesScene principles={section.principles} />
    </section>
  );
}

export function InnovationSection() {
  return <section className="portfolio-section content-section upcoming-section" id="innovation" aria-labelledby="innovation-title">
    <header className="studio-section-title">
      <h2 id="innovation-title">In the making.</h2>
      <p>Upcoming projects</p>
    </header>
    <UpcomingProjects />
  </section>;
}

export function ApproachSection() {
  const section = content.approach;

  return <section className="portfolio-section content-section engineering-section" id="approach" aria-labelledby="approach-title">
    <header className="studio-section-title">
      <p>How we work</p>
      <h2 id="approach-title"><ExploreText>{section.title}</ExploreText></h2>
    </header>
    <AssemblyProcess stages={section.stages} />
  </section>;
}

export function WhySection() {
  return (
    <section
      className="portfolio-section content-section working-together"
      id="why-octagram"
      aria-labelledby="why-title"
    >
      <header className="partnership-heading">
        <h2 id="why-title" className="partnership-title">
          <span><span>Built</span></span>{" "}<span><span>together.</span></span>
        </h2>
        <p>
          <span className="partnership-desktop-hint">Drag a card onto any outlined spot.</span>
          <span className="partnership-touch-hint">Tap a card, then a lit spot.</span>
          {" "}Connect all six to assemble Octagram.
        </p>
      </header>
      <PartnershipScene points={content.whyOctagram.reasons} />
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
          </svg><span>Talk on WhatsApp <i aria-hidden="true">↗</i></span>
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
          </svg><span>Instagram <i aria-hidden="true">↗</i></span>
        </a>
      </div>
    </div>
  );
}

