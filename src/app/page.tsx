import { SectionBar } from "@/components/BrandPanels";
import SurfaceMotion from "@/components/SurfaceMotion";
import JourneyInteractions from "@/components/JourneyInteractions";
import ServiceCards from "@/components/ServiceCards";
import EyeIntro from "@/components/EyeIntro";
import EyeOutro from "@/components/EyeOutro";
import ExperienceLoader from "@/components/ExperienceLoader";
import SiteInteractions from "@/components/SiteInteractions";
import { companyContent as content } from "@/lib/company-content";
import {
  MissionSection,
  ApproachSection,
  WhySection,
  ContactContext,
  PortfolioIntro,
  ProjectStudies,
} from "@/components/CompanySections";
import { siteConfig, safeHref, contactEmail } from "@/lib/site-config";

// Server-rendered semantic content stays readable without JavaScript or WebGL.

const approvedTeam = siteConfig.team.filter((person) => person.name.trim());
function TeamWindows() {
  return (
    <div className="team-windows" aria-label="Octagram team">
      {approvedTeam.map((person, index) => (
        <article
          className="team-window"
          key={person.name}
          aria-labelledby={`team-person-${index}`}
        >
          <header className="terminal-titlebar">
            <span className="terminal-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>octagram — team/0{index + 1}</span>
            <span className="terminal-shell" aria-hidden="true">
              zsh
            </span>
          </header>
          <div className="terminal-content">
            <p className="terminal-command" aria-hidden="true">
              <span>octagram@team</span>
              <b>:~$</b> whoami
            </p>
            <div className="team-window-heading">
              <h3 id={`team-person-${index}`}>{person.name}</h3>
              <span className="team-window-role">{person.role}</span>
            </div>
            <p className="terminal-command" aria-hidden="true">
              <b>$</b> cat profile.md
            </p>
            <p className="team-window-summary">{person.description}</p>
            <div className="team-window-body">
              <span className="team-window-label"># Responsibilities</span>
              {person.bio?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <footer className="team-window-footer">
              <span className="terminal-idle" aria-hidden="true">
                ~$ <i />
              </span>
              {safeHref(person.url) && (
                <a
                  href={safeHref(person.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${person.name} on LinkedIn`}
                >
                  open linkedin
                </a>
              )}
            </footer>
          </div>
        </article>
      ))}
    </div>
  );
}
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
          <span>Made with care</span>
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
              {["Designing", "impact", "Engineering", "beauty"].map((line) => (
                <span className="hero-line" key={line}>
                  <span>{line}</span>
                </span>
              ))}
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
            <p className="section-kicker">OCTAGRAM / {content.about.label}</p>
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
              <p>Every idea starts somewhere</p>
              <p>We help it take shape</p>
            </div>
          </div>
          <div className="stage narrative" data-phase="connections">
            <div className="manifesto-copy">
              <p>Understand the need</p>
              <p>
                Build with care
                <br />
                Leave room to grow
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
          className="stage logo-story"
          id="vision"
          data-phase="logo"
          aria-labelledby="vision-title"
        >
          <div className="vision-reading">
            <img
              className="stage-fallback logo-poster"
              src="/assets/brand/logo.svg"
              alt="The original eight-part Octagram mark with open negative space"
              width="700"
              height="700"
              loading="lazy"
            />
            <div className="side-copy copy-right mobile-blur">
              <p className="section-kicker">
                OCTAGRAM / {content.vision.label}
              </p>
              <h2 id="vision-title">{content.vision.title}</h2>
              {content.vision.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="vision-passage" aria-hidden="true" />
        </section>
        <section
          className="stage jordan"
          id="jordan"
          data-phase="globe"
          aria-labelledby="jordan-title"
        >
          <img
            className="stage-fallback globe-poster"
            data-poster="globe"
            src="/assets/globe-fallback.svg"
            alt="Earth centered on the Middle East with Jordan geographically marked"
            width="850"
            height="850"
            loading="lazy"
          />
          <div className="side-copy roots-copy">
            <p className="section-kicker">OCTAGRAM / OUR ROOTS</p>
            <h2 id="jordan-title">
              Rooted in Jordan
              <br />
              Open to what’s next
            </h2>
            <p>{content.about.paragraphs[0]}</p>
            <p>{content.about.paragraphs[3]}</p>
            <span className="geo-label">
              <i></i> JORDAN <small>31.9539° N / 35.9106° E</small>
            </span>
          </div>
          <div className="roots-orbit" aria-hidden="true" />
        </section>
        <section
          className="team content-section company-team"
          id="team"
          aria-labelledby="team-title"
        >
          <SectionBar label="OUR TEAM" count="01 — 04" />
          <div className="team-head">
            <h2 id="team-title">
              The people
              <br />
              behind Octagram
            </h2>
            <div className="team-intro">
              {content.teamIntro.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <a className="text-link" href="#contact">
                Start a conversation
              </a>
            </div>
          </div>
          <TeamWindows />
        </section>
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
          <div id="project-list" className="project-desktop-host">
            <ProjectStudies />
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
                <label htmlFor="interest">What you have in mind</label>
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
                  placeholder="What would you like to build and who is it for?"
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
                    ? "Review and email your brief"
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
          <a href="#work">Work</a>
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
          <span className="eyebrow">YOUR PROJECT BRIEF</span>
          <button
            type="button"
            className="icon-button close-dialog"
            aria-label="Close project brief"
          >
            ×
          </button>
        </div>
        <h2 id="brief-title">
          Your idea
          <br />
          in focus
        </h2>
        <p id="brief-help">
          Copy or download your brief to share when you are ready. Nothing has
          been sent.
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
