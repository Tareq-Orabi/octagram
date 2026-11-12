import { SectionBar } from "@/components/BrandPanels";
import SurfaceMotion from "@/components/SurfaceMotion";
import JourneyInteractions from "@/components/JourneyInteractions";
import ProjectArrival from "@/components/ProjectArrival";
import TeamProfiles from "@/components/TeamProfiles";
import ServiceCards from "@/components/ServiceCards";
import EyeIntro from "@/components/EyeIntro";
import EyeOutro from "@/components/EyeOutro";
import ExperienceLoader from "@/components/ExperienceLoader";
import SiteInteractions from "@/components/SiteInteractions";
import { companyContent as content } from "@/lib/company-content";
import {
  MissionSection,
  ProductStudies,
  ApproachSection,
  WhySection,
  ContactContext,
  PortfolioIntro,
  ProjectStudies,
} from "@/components/CompanySections";
import { siteConfig, safeHref, contactEmail } from "@/lib/site-config";

// Server-rendered semantic content stays readable without JavaScript or WebGL.

function SocialLinks() {
  return (
    <>
      {siteConfig.socialLinks.map((link, index) => {
        const href = safeHref(link.url);
        return href && link.label ? (
          <a
            key={`${link.label}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        ) : null;
      })}
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ExperienceLoader />
      <EyeIntro />
      <header className="header" id="top">
        <a className="brand" href="#home" aria-label="Octagram home">
          <img src="/assets/brand/logo.svg" width="32" height="32" alt="" />
          <span className="brand-wordmark">
            <span>OCTAGRAM</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#expertise">Services</a>
          <a href="#work">Work</a>
          <a href="#team">Team</a>
        </nav>
        <div className="header-actions">
          <a className="button primary header-contact" href="#contact">
            <span>Let&#x27;s talk</span>
          </a>
          <button
            className="menu-toggle icon-button"
            type="button"
            aria-expanded="false"
            aria-controls="mobile-menu"
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      <div className="mobile-menu" id="mobile-menu" hidden>
        <nav aria-label="Mobile navigation">
          <a href="#about">
            About <span>01</span>
          </a>
          <a href="#expertise">
            Services <span>02</span>
          </a>
          <a href="#work">
            Work <span>03</span>
          </a>
          <a href="#team">
            Team <span>04</span>
          </a>
          <a href="#contact">Let&#x27;s build together</a>
        </nav>
        <div className="mobile-menu-bottom">
          <span>Engineering what&#x27;s next.</span>
        </div>
      </div>
      <main id="main">
        <section
          className="stage hero company-hero"
          id="home"
          data-phase="brain"
          aria-labelledby="hero-title"
        >
          <img
            className="stage-fallback brain-poster"
            data-poster="brain"
            src="/assets/brain-fallback.webp"
            alt="An organic brain built from Octagram-colored particles"
            width="900"
            height="850"
            fetchPriority="high"
          />
          <p className="portfolio-edition">{content.brand.portfolioLabel}</p>
          <div className="hero-content">
            <h1 id="hero-title">
              {["Designing", "impact.", "Engineering", "beauty."].map(
                (line) => (
                  <span className="hero-line" key={line}>
                    <span>{line}</span>
                  </span>
                ),
              )}
            </h1>
            <div className="hero-body mobile-blur">
              <p className="eyebrow" data-reveal="hero-body">
                {content.brand.disciplineLine}
              </p>
              <p className="hero-description" data-reveal="hero-body">
                {content.brand.heroTitle}
              </p>
              <div className="hero-cta-mask">
                <a className="button primary hero-cta" href="#contact">
                  <span>Let&#x27;s build together</span>
                </a>
              </div>
            </div>
          </div>
        </section>
        <section
          className="stage stage-tall intro"
          id="about"
          data-phase="intro"
          aria-labelledby="about-title"
        >
          <div className="side-copy copy-right mobile-blur">
            <p className="section-kicker">{content.about.label}</p>
            <h2 id="about-title">{content.about.title}</h2>
            {content.about.paragraphs.slice(0, 2).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <details className="editorial-disclosure">
              <summary>
                More about Octagram<span aria-hidden="true">+</span>
              </summary>
              <div className="detail-content">
                {content.about.paragraphs.slice(2).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          </div>
          <img
            className="stage-fallback intro-poster"
            data-poster="brain"
            src="/assets/brain-fallback.webp"
            alt=""
            width="700"
            height="700"
            loading="lazy"
          />
        </section>
        <section
          className="manifesto"
          id="manifesto"
          aria-label="Our engineering manifesto"
        >
          <div className="stage narrative" data-phase="fragments">
            <div className="manifesto-copy">
              <p>Good software starts</p>
              <p>with a real problem.</p>
            </div>
          </div>
          <div className="stage narrative" data-phase="connections">
            <div className="manifesto-copy">
              <p>Listen closely.</p>
              <p>
                Make it useful.
                <br />
                Make it last.
              </p>
            </div>
          </div>
          <div className="stage narrative" data-phase="clarity">
            <div className="manifesto-copy">
              <p>{content.closing.lead}</p>
              <p>{content.closing.headline}</p>
            </div>
          </div>
        </section>
        <div className="scene-transition" aria-hidden="true"></div>
        <section
          className="stage stage-tall logo-story"
          id="vision"
          data-phase="logo"
          aria-labelledby="vision-title"
        >
          <div className="vision-frame">
            <img
              className="stage-fallback logo-poster"
              src="/assets/brand/logo.svg"
              alt="The original eight-part Octagram mark with open negative space"
              width="700"
              height="700"
              loading="lazy"
            />
            <div className="side-copy copy-right mobile-blur vision-copy">
              <p className="section-kicker">{content.vision.label}</p>
              <h2 id="vision-title">{content.vision.title}</h2>
              {content.vision.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="logo-passage-distance" aria-hidden="true" />
        </section>
        <div className="roots-handoff" id="jordan">
          <section
            className="stage stage-tall jordan"
            id="roots-scene"
            data-phase="globe"
            aria-labelledby="jordan-title"
          >
            <div className="side-copy mobile-blur roots-copy">
              <p className="section-kicker">OUR ROOTS</p>
              <h2 id="jordan-title">
                Rooted in Jordan.
                <br />
                Open to the world.
              </h2>
              <p>A team from Jordan, building software for the people and ideas around us—and wherever they take us next.</p>
              <span className="geo-label">
                <i></i> JORDAN <small>31.9539° N / 35.9106° E</small>
              </span>
            </div>
            <div className="roots-planet-window">
              <img
                className="stage-fallback globe-poster"
                data-poster="globe"
                src="/assets/globe-fallback.svg"
                alt="Earth centered on the Middle East with Jordan geographically marked"
                width="850"
                height="850"
                loading="lazy"
              />
            </div>
          </section>
          <section
            className="team content-section company-team roots-cover"
            id="team"
            aria-labelledby="team-title"
          >
            <SectionBar label="OUR TEAM" count="01 — 04" />
            <div className="team-head">
              <h2 id="team-title">The people building it.</h2>
              <div className="team-intro">
                {content.teamIntro.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <a className="text-link" href="#contact">
                  Start a conversation
                </a>
              </div>
            </div>
            <TeamProfiles />
          </section>
        </div>
        <MissionSection />

        <section
          className="expertise content-section service-section"
          id="expertise"
          aria-labelledby="expertise-title"
        >
          <ServiceCards services={content.services.items} />
        </section>

        <section
          className="work content-section"
          id="work"
          aria-labelledby="work-title"
        >
          <PortfolioIntro section={content.projectsIntro} id="work-title" />
          <div className="project-group project-group--selected" aria-labelledby="selected-projects-title">
            <div className="project-group-heading">
              <h3 id="selected-projects-title">Selected work</h3>
              <p>Built around real needs.</p>
            </div>
            <ProjectArrival>
              <ProjectStudies />
            </ProjectArrival>
          </div>
          <div className="project-group" id="innovation" aria-labelledby="innovation-title">
            <div className="project-group-heading">
              <h3 id="innovation-title">In development</h3>
              <p>The ideas we’re building next.</p>
            </div>
            <ProjectArrival id="development-project-list">
              <ProjectStudies inDevelopment />
              <ProductStudies />
            </ProjectArrival>
          </div>
        </section>
        <ApproachSection />
        <WhySection />

        <EyeOutro />

        <section
          className="contact content-section"
          id="contact"
          aria-labelledby="contact-title"
        >
          <h2 id="contact-title">{content.contact.title}</h2>
          <ContactContext />
          <details className="contact-panel">
            <summary className="button primary">
              <span>Let&#x27;s build together</span>
            </summary>
            <form id="contact-form">
              <div className="form-row">
                <div className="field">
                  <label htmlFor="name">
                    Your name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    required
                    maxLength={120}
                  />
                </div>
                <div className="field">
                  <label htmlFor="email">
                    Email address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    placeholder="alex@company.com"
                    required
                    maxLength={254}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="interest">What are you thinking about?</label>
                <select id="interest" name="interest">
                  <option value="A new project">A new project</option>
                  {content.services.items.map((service) => (
                    <option key={service.id}>{service.title}</option>
                  ))}
                  <option>Something else</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="message">
                  A little about your idea <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder="The ambition, the challenge, the possibilities…"
                ></textarea>
              </div>
              <p className="form-note" id="form-note">
                {contactEmail
                  ? "Review your brief, then send it with your email app. Your details stay in this browser until you send."
                  : "Prepare a project brief to copy or download. Your details stay in this browser and are not sent."}
              </p>
              <button className="button primary" type="submit">
                <span id="submit-label">
                  {contactEmail
                    ? "Review & email your brief"
                    : "Prepare project brief"}
                </span>
              </button>
            </form>
          </details>
        </section>
      </main>
      <footer className="footer">
        <a className="brand" href="#home" aria-label="Octagram home">
          <img src="/assets/brand/logo.svg" width="28" height="28" alt="" />
          <span>OCTAGRAM</span>
        </a>
        <p>
          © <span id="year">{new Date().getFullYear()}</span> Octagram
        </p>
        <nav aria-label="Footer navigation">
          <a href="#about">About</a>
          <a href="#team">Team</a>
          <a href="#expertise">Services</a>
          <a href="#work">Projects</a>
          <a href="#approach">Approach</a>
          <a href="#contact">Contact</a>
          <span id="social-links">
            <SocialLinks />
          </span>
        </nav>
        <a href="#home" className="back-top" aria-label="Back to top">
          Top
        </a>
      </footer>
      <dialog id="brief-dialog" aria-labelledby="brief-title">
        <div className="dialog-top">
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <button
            type="button"
            className="icon-button close-dialog"
            aria-label="Close project brief"
          >
            ×
          </button>
        </div>
        <h2 id="brief-title">
          Your idea,
          <br />
          in focus.
        </h2>
        <p id="brief-help">
          Your brief is ready. Copy or download it to share when you&#x27;re
          ready. Nothing has been sent.
        </p>
        <pre id="brief-preview"></pre>
        <div className="dialog-actions">
          <button id="copy-brief" className="button primary" type="button">
            Copy brief
          </button>
          <button
            id="download-brief"
            className="button secondary"
            type="button"
          >
            Download .txt
          </button>
          <a id="email-brief" className="button primary" hidden>
            Open email
          </a>
        </div>
        <p
          id="brief-status"
          className="status-message"
          role="status"
          aria-live="polite"
        ></p>
      </dialog>
      <noscript>
        <div className="noscript-note">
          Enable JavaScript for the animated journey and project brief tool. The
          full story and static artwork remain available.
        </div>
      </noscript>

      <SiteInteractions />
      <JourneyInteractions />
      <SurfaceMotion />
    </>
  );
}
