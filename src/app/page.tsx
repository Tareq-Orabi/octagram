import HeroPalette from "@/components/HeroPalette";
import SurfaceMotion from "@/components/SurfaceMotion";
import JourneyInteractions from "@/components/JourneyInteractions";
import ProjectScenes from "@/components/ProjectScenes";
import PortfolioField from "@/components/PortfolioField";
import TeamStudio from "@/components/TeamStudio";
import StudioMotion from "@/components/StudioMotion";
import KineticLink, { AnimatedLabel } from "@/components/KineticLink";
import BinaryHeadline from "@/components/BinaryHeadline";
import ExploreText from "@/components/ExploreText";
import RotatingCta from "@/components/RotatingCta";
import NavBrand from "@/components/NavBrand";
import SpotlightNav from "@/components/SpotlightNav";
import ServiceCards from "@/components/ServiceCards";
import EyeIntro from "@/components/EyeIntro";
import EyeOutro from "@/components/EyeOutro";
import ExperienceLoader from "@/components/ExperienceLoader";
import CompactBrain from "@/components/CompactBrain";
import SiteInteractions from "@/components/SiteInteractions";
import { companyContent as content } from "@/lib/company-content";
import { compactMotionQuery } from "@/lib/experience-preferences";
import compactBrainPoster from "@/assets/brain/hero-compact.webp";
import {
  MissionSection,
  InnovationSection,
  ApproachSection,
  WhySection,
  ContactContext,
} from "@/components/CompanySections";
import { siteConfig, safeHref, contactEmail } from "@/lib/site-config";

// Server-rendered semantic content stays readable without JavaScript or WebGL.

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ExperienceLoader />
      <CompactBrain />
      <EyeIntro />
      <header className="header" id="top">
        <NavBrand />
        <SpotlightNav />
        <div className="header-actions">
          <KineticLink className="button primary header-contact" href="#contact" arrow={false}>Let's talk</KineticLink>
        </div>
      </header>
      <main id="main">
        <section
          className="stage hero company-hero"
          id="home"
          data-phase="brain"
          data-hero-palette="original"
          aria-labelledby="hero-title"
        >
          <div className="hero-artwork">
            <picture>
              <source media={compactMotionQuery} srcSet={compactBrainPoster.src} />
              <img
                className="stage-fallback brain-poster"
                data-poster="brain"
                src="/assets/brain-fallback.webp"
                alt="A brain formed from thousands of particles"
                width="1080"
                height="1020"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <HeroPalette />
          </div>
          <div className="hero-content">
            <BinaryHeadline id="hero-title" lines={["Designing impact.", "Engineering beauty."]} />
            <div className="hero-body mobile-blur">
              <p className="hero-description" data-reveal="hero-body">
                {content.brand.heroTitle}
              </p>
              <div className="hero-cta-mask">
                <RotatingCta />
                <KineticLink className="hero-work-link" href="#work">Explore our work</KineticLink>
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
            <h2 id="about-title"><ExploreText>{content.about.title}</ExploreText></h2>
            {content.about.paragraphs.slice(0, 2).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <details className="editorial-disclosure">
              <summary>
                <AnimatedLabel>More about Octagram</AnimatedLabel><span aria-hidden="true">+</span>
              </summary>
              <div className="detail-content">
                {content.about.paragraphs.slice(2).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          </div>
          <picture>
            <source media={compactMotionQuery} srcSet={compactBrainPoster.src} />
            <img
              className="stage-fallback intro-poster"
              data-poster="brain"
              src="/assets/brain-fallback.webp"
              alt=""
              width="1080"
              height="1020"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </section>
        <section
          className="manifesto"
          id="manifesto"
          aria-label="Our engineering manifesto"
        >
          <div className="stage narrative" data-phase="fragments">
            <div className="manifesto-copy">
              <p>Good software starts</p>
              <p>with a real <em>problem.</em></p>
            </div>
          </div>
          <div className="stage narrative" data-phase="connections">
            <div className="manifesto-copy">
              <p>Listen closely.</p>
              <p>
                Make it <em>useful.</em>
                <br />
                Make it <em>last.</em>
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
              <h2 id="vision-title"><ExploreText>{content.vision.title}</ExploreText></h2>
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
              <h2 id="jordan-title" className="roots-transmission" aria-label="Rooted in Jordan. Open to the world.">
                <span className="roots-line" aria-hidden="true"><span className="roots-ink">Rooted in <em className="roots-origin">Jordan.</em></span></span>
                <span className="roots-line" aria-hidden="true"><span className="roots-ink">Open to the world.</span></span>
              </h2>
              <p>A team from Jordan, building software for the <strong>people and ideas</strong> around us—and wherever they take us next.</p>
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
            className="team content-section company-team roots-cover team-reel-section"
            id="team"
            aria-labelledby="team-title"
          >
            <h2 id="team-title" className="sr-only">The people building it.</h2>
            <TeamStudio members={siteConfig.team.map(member => ({ ...member, url: safeHref(member.url) }))} />
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

        <PortfolioField>
          <section className="work content-section" id="work" aria-labelledby="work-title">
            <ProjectScenes />
          </section>
          <InnovationSection />
          <ApproachSection />
          <WhySection />
        </PortfolioField>
        <div className="closing-scene">
          <EyeOutro />

          <section
            className="contact content-section"
            id="contact"
            aria-labelledby="contact-title"
          >
            <h2 id="contact-title"><ExploreText>{content.contact.title}</ExploreText></h2>
            <ContactContext />
            <details className="contact-panel">
              <summary className="button primary">
                <span>Prepare a project brief <span aria-hidden="true">↗</span></span>
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
                      placeholder="e.g. Mohammed "
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
                      placeholder="[EMAIL_ADDRESS]"
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
                    placeholder="What are you building, and what would you like help with?"
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
          <footer className="footer clean-footer" role="contentinfo">
            <a className="footer-brand" href="#home" aria-label="Octagram home">
              <img src="/assets/brand/logo.svg" width="28" height="28" alt="" loading="lazy" />
              <span>OCTAGRAM</span>
            </a>
            <nav aria-label="Octagram links"><a href="https://www.instagram.com/octagram.jo/" target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden="true">↗</span></a><a href="https://wa.me/962780668491" target="_blank" rel="noopener noreferrer">WhatsApp <span aria-hidden="true">↗</span></a></nav>
            <a href="#home" className="footer-top" aria-label="Back to top">Back to top <span aria-hidden="true">↑</span></a>
            <p className="footer-copyright">
              © <span id="year">{new Date().getFullYear()}</span> Octagram
            </p>
            <span className="footer-location">From Jordan, with purpose.</span>
          </footer>
        </div>
      </main>
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
        <div className="brief-summary">
          <div className="brief-summary-person"><span id="brief-person" /><small id="brief-email" /></div>
          <p className="brief-summary-interest" id="brief-interest" />
          <p className="brief-summary-idea" id="brief-idea" />
        </div>
        <details className="brief-plain"><summary>Plain text version</summary><pre id="brief-preview" /></details>
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
          <a id="whatsapp-brief" className="button secondary" href="https://wa.me/962780668491" target="_blank" rel="noopener noreferrer">Share via WhatsApp ↗</a>
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
      <StudioMotion />
    </>
  );
}
