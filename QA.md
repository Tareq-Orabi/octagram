# Validation — 26 October 2026

This record covers the approved company portfolio update in the Next.js / React / TypeScript implementation. It separates static checks, manual browser observations, and unavailable automation.

## Passed static and build checks

| Check | Result |
| --- | --- |
| `npm run check` | TypeScript validation completed without errors. |
| `npm run build` | Production build and static export completed using the supported Next.js Webpack path. Routes: `/`, `/robots.txt`, `/sitemap.xml`, and the generated not-found page. |
| `node checks.mjs` | 32 JavaScript files, 3 inline executable scripts, 1 stylesheet, 17 local references and 53 unique IDs checked. Assets, syntax, anchors, labels and ARIA references pass. Semantic text-token contrast is at least 4.73:1. |
| Portfolio export audit | All 144 approved source prose/bullet lines and all 156 typed paragraph/list/member-role items appear in the exported HTML outside scripts/styles. All eight supplied anchor URLs are present. |
| SEO export audit | Canonical URL, Organization JSON-LD, robots sitemap declaration and sitemap root use `https://octagramjo.com/`. |
| `npm run check:models` | Meshopt logo decodes: 8 modules, 12 meshes, 12 gradient textures, finite geometry, and zero center-ray intersections through the intended hole. |
| `node scripts/check_brain_asset.mjs` | PASS: 10,000 particles, zero position error against the extracted reference, byte-identical particle geometry, finite numeric data. |

`validation/portfolio-content.json` records source/export hashes, coverage counts, exact statuses and scope limitations. `assets/source/company-portfolio-2026.txt` preserves the supplied source.

The first Turbopack build failed when its CSS processing worker tried to bind an internal port. Granting network access did not resolve that restriction. The build now explicitly uses `next build --webpack`, which completed successfully; the delivered `out/` was produced by that command.

## Content and interaction changes

The export contains six services, four industries, three projects, four logical team members, two product initiatives, five engineering stages and six differentiators. Six Senses is **Delivered**; Medical Club is **Development & Deployment**, with **Designed Capabilities**. ThaaerFit has no invented launch status. THINK and OCTACARE are both **Product initiative under development.**

The four team biographies and the three supplied LinkedIn links are retained. Missing photographs use branded initials. No email address, launch date, client claim or measured business result was invented. The website and Instagram destinations are supplied company links.

Expanded biographies grow the desktop team grid. Without JavaScript, CSS displays all four biography panels and links; disclosures remain native HTML. Project industry metadata is semantic text outside decorative artwork. The service formation ends at the expertise section. Particle opacity is reduced behind longer editorial content and restored during the closing scene.

## Manual browser verification

The production export returned HTTP 200 and was inspected in the in-app browser:

- Viewports 375, 768, 1024, 1440 and 1920px: no document horizontal overflow; all four hero lines fit their clipping boxes.
- At 375px, about, vision and Jordan copy remain within their sections; no checked heading, project text panel, product card or profile panel exceeds the viewport width.
- Dark/light rendering inspected, including the live brain and the quieter editorial background. Captured console warning/error logs were empty.
- Mobile menu opens and focuses navigation; selecting an anchor closes it. All six service panels were opened sequentially, with only the chosen panel open.
- Team profile disclosures open with mouse and keyboard. The carousel starts with Tareq Orabi, its next control selects Mazen Abu Tahoun, and End reaches Zaid Al Taih. Next from the last member wraps to Tareq Orabi. Four logical profiles are present despite duplicated visual cycles.
- Project overview/details expand. The three external project destinations and the two supplied project statuses match the source. Six Senses displays seven capabilities; Medical Club has ten designed capabilities; ThaaerFit has five focus items.
- THINK expands its full vision and ambition; both product cards visibly retain their development status.
- The contact form accepts the newly added infrastructure service and opens the local brief dialog with the supplied test values. No message was sent. Instagram is the direct contact destination.
- After a real resize/navigation issue was found, layout updates were switched to safe ScrollTrigger refresh. A manual jump from contact at 375px to home immediately after resizing to 1440px now completes at scrollY=0. Direct section anchors and final screenshots were checked on the rebuilt export.

These are manual browser observations, not a claim that all automated assertions or every device/browser combination passed.

## Browser automation: blocked before assertions

`npm run test:e2e` discovered 15 cases across Chrome, Firefox and WebKit. All failed at browser launch before page assertions. Chrome closed during launch in the restricted environment; the first run also lacked the default-cache Firefox/WebKit executables.

A focused retry used the already installed browser binaries under the workspace via `PLAYWRIGHT_BROWSERS_PATH`. Firefox terminated with SIGABRT; WebKit terminated with Abort trap 6. This confirms the retry did not reach page assertions. Reports are saved in `validation/browser-launch-results.json` and `validation/browser-launch-retry.json`. These failures are not website assertion failures and are not passes. A resize-during-anchor regression assertion was added after the launch attempts; it has been checked manually but still requires a successful automated browser launch.

A previous Lighthouse attempt could not launch its browser. No Lighthouse score, physical-phone FPS, thermal/battery result, field Core Web Vitals, or universal GPU compatibility result is claimed. No new Lighthouse run was made for this content revision.

## Assets and delivery limits

The logo remains 215,968 bytes; the brain asset is 280,560 bytes. The brain has 20 vertices and 48 triangles per particle: 480,000 triangles at the full count, or 336,000 at the configured 7,000-particle mobile count. Geometry counts are not measured frame rates. Provenance and licenses remain beside the source assets.

The brief is prepared locally for preview/copy/download. Adding a contact email enables an email-app handoff; there is no backend mail service. No deployment is claimed. The supplied project links were preserved, but this audit does not certify the contents or availability of third-party sites.


## Eye opening update — 5 November 2026

The loader now draws an eye with only the letters in `octagram`, stronger amber/brown iris colors, an initially closed lid, a slower opening, a gentle camera approach and an accelerating dive into the pupil before revealing the existing site. The source is a procedural reconstruction of the supplied filmed reference, not the original eye asset or a pixel-exact extraction.

Verified on the updated static export:

- `npm run check`, `npm run build`, and `node checks.mjs` passed. The final export audit checked 32 JavaScript chunks and four inline executable scripts.
- In-app browser at 1280×800: closed and open eye screenshots captured; the sequence reaches `revealing`, hides the loader, removes its canvas, and restores the normal page. The theme control remains usable afterward. Captured warning/error logs were empty.
- At 375×812: the eye fits the viewport; lower character density retains the branded lettering. No horizontal document overflow was observed. Open-eye screenshot captured.
- Skip button, Escape and the explicit `?skiploader` path were manually exercised. The startup script also preserves direct access for hash links and reduced-motion users.
- Added Playwright regression coverage for stage order, skip methods, deep links, blocked model assets and JavaScript-disabled access. The new automated cases have not run successfully here: the headless Chrome smoke launch terminated with SIGABRT before assertions. Existing canvas checks now target the WebGL stage specifically.

No hosted deployment was performed. No physical-device frame-rate or battery measurement is claimed.


### Isolated eye and gaze revision — 5 November 2026

Removed the surrounding rectangular skin/brow character field. Only the almond-shaped eye and a narrow curved lid edge are drawn. Added right/left gaze movements that translate the iris fibers, pupil and highlights under stationary lids, followed by a centered pause before the camera dive.

- TypeScript validation, production build and export audit passed.
- `node scripts/check_eye_intro.mjs` passed at 375px and 1280px: actual glyph commands stay within the isolated eye bounds, the closed pose remains a narrow lid, only octagram letters are drawn, and the iris centroid travels in both directions.
- Browser screenshots at 1280×800 and 375×812 confirm the rectangular field is absent. The completed opening reports a centered gaze, hides the overlay and removes its canvas. Warning/error logs were empty.
- No new full Playwright run or physical-device performance measurement is claimed.


## Service card wheel — 5 November 2026

Replaced the six-service accordion with the user's eight supplied service groups and all 43 bullet items. The reference's geometric card designs use only existing Octagram palette variables. Following the user's refinement, the cards remain upright, have wider spacing, and orbit automatically like a Ferris wheel. Opening a card stops rotation and reveals its content; Previous/Next wrap between all eight services. Dragging, keyboard navigation, hover/focus pause, a rotation toggle and the site's global motion toggle are supported. Reduced-motion and no-JavaScript states expose a static grid with full contents.

Validation on the final export:

- TypeScript and production build passed. Export syntax, asset paths, labels, anchors and ARIA references passed `node checks.mjs` (77 unique IDs).
- Parsed the exported article markup independently and compared it with the supplied content: eight exact titles and all 43 exact detail items passed. Recorded in `validation/services-content.json`. This replaces the earlier six-service content snapshot for the services section only.
- In-app browser: all eight cards navigated in order with item counts 5/5/7/6/5/6/4/5, then wrapped to the first. The final wheel visibly moves over time, all card transforms retain zero rotation, and measured desktop rectangles have zero overlaps. Opening a card stops the rotation. Pause/Resume and Escape were exercised.
- Mobile viewport 375×812 reports no horizontal document overflow. The eight form service options use the updated shared data.
- Desktop overview and expanded-card screenshots captured. Earlier Playwright launch restrictions still apply; no new successful full automated-browser run or physical-device performance measurement is claimed.

The eye intro and all other site sections are preserved. No hosted deployment was performed.

### Service wheel interaction follow-up — 5 November 2026

Fixed an unintended permanent pause after closing a card with the pointer: only visible keyboard focus now pauses the orbit. Focus still returns to the originating card.

- In-app browser at 390×844: the longest service card exposes all seven entries and its contact link without horizontal overflow.
- At 320×740: all seven entries remain readable; the content area scrolls for the remaining space (412px content in a 393px area), with no horizontal document overflow.
- Verified that pointer return resumes the orbit (changing card transforms), while Tab navigation gives visible focus and pauses rotation.
- TypeScript, production build and exported-file checks passed. Browser viewport checks are not a physical-device test.

## Floating navigation and scene refinement — 6 November 2026

- Replaced the full-width header with a centered floating capsule, active-link pills, and a compact mobile menu. The logo wordmark stays visible while scrolling.
- Removed the light palette, theme controls, stored/system-theme selection, scene theme events and alternate shader/material branches. Removed the two shipped light fallback assets and their poster-generation path. The site always starts dark.
- Kept full logo models and ambient brand pieces upright. Removed the diagonal narrative roll at the two logo poses and camera tilt while the logo is assembled.
- Added a deterministic second layer of brain particles: 20,000 at full quality and a 14,000 adaptive minimum. Reference source data remain intact. Brain and globe expansion, surface sampling and reusable morph buffers have matching capacities.
- `node scripts/check_scene_refinements.mjs` exercises actual instance attributes, finite morph targets, distinct particle locations, adaptive counts and upright narrative poses. It passed along with TypeScript, the production build and the export audit.
- In-app browser: the canvas reports 20,000 particle capacity and logo rotation `0,0,0`; dark UI has no theme controls. Desktop header measures 1000×72 with a 20px top gap. At 390px and 320px, the capsule fits the viewport with no horizontal overflow. The mobile menu opens, makes main content inert, and Escape closes it and restores access. Hero and menu were visually checked.
- Updated existing browser test expectations for dark-only behavior. No full automated-browser suite or physical-device performance result is claimed.

The local preview is updated; no hosted deployment was performed.


## Scroll choreography replacement — 6 November 2026

The original brain, logo, globe and ambient brand geometry and their asset files are preserved byte-for-byte. Scroll direction now controls independent depth paths: the brain arcs into the about section and opens into a particle vortex, logo modules assemble along four straight rails, and the globe rises from below and advances toward the camera before the team section. Ambient pieces move into a depth corridor during handoffs. The closing logo returns as a subdued contact backdrop. Logo modules retain zero rotation.

- Expanded the geometry check to exercise the actual 20,000-particle vortex, its open center and spring return to the original anatomy; the adaptive 14,000 minimum remains. Desktop/mobile tracks are swept in 0.001 increments for finite, continuous poses, valid opacity/scale, camera clearance, exact logo assembly and reversible scroll poses.
- TypeScript, production export and static export checks passed.
- In-app browser: brain, vortex, upright assembled logo and mobile globe were visually inspected. At 390×844, no document horizontal overflow was observed; text remains readable above the existing mobile art gradient. Pause removes the live WebGL canvas; Resume restores it, including 20,000-particle capacity and zero logo rotation. Captured warning/error logs were empty.
- Navigation, dark-only styling, eye intro and service wheel source files were unchanged. No new successful full Playwright run or physical-device performance measurement is claimed.

The local export and preview are updated; no hosted deployment was performed.


### Slower cinematic pacing and restored brain turn — 6 November 2026

Per the latest refinement, the brain now retains its complete anatomy and rotates leftward around its vertical axis, continuing gently through its exit. Removed the vortex deformation and its per-particle orbit calculations. The other depth transitions remain, with a longer logo assembly interval, longer presentation holds, a shorter/slower globe approach, softer pointer parallax and 65% playback speed for living materials and ambient movement. Scroll animation catch-up is 1.6 seconds (previously 0.7); native document scrolling is unchanged.

- TypeScript, production build, export audit and the updated scene geometry check passed. The geometry check verifies unchanged brain coordinates during parent rotation, a sustained one-direction turn, continuous/reversible desktop and mobile tracks, camera clearance, upright logo assembly and the unchanged 20,000/14,000 particle capacities.
- All shipped model and brand asset files are byte-identical to the previous version.
- Browser inspection confirms the brain turns without becoming a ring, the new scroll timing is active, and the logo remains upright. At 390×844 the logo and copy remain readable with zero horizontal overflow. Captured warning/error logs were empty.
- No full automated browser suite or physical-device performance measurement was run for this pacing change.

Local preview updated; no hosted deployment.


## Four team windows — 6 November 2026
Replaced the repeated team carousel with four semantic profile articles in a two-column desktop grid and a single mobile column. The supplied screenshot informs the bordered shells, name badges, inset responsibility panels and monospace labels; all colors use existing site tokens. All four approved names, roles, descriptions, biographies and three supplied LinkedIn destinations are preserved and always visible. Removed carousel controls and event handling.

Production build (including TypeScript) and export audit passed. Browser inspection at desktop and 390×844 confirmed four cards, two/one grid columns, three links and zero horizontal overflow. Warning/error logs were empty. Updated the existing carousel regression expectation; no full automated browser suite run is claimed. 3D scenes and their timing were unchanged. Local-only update.


### Terminal profile styling — 6 November 2026
Team windows now use terminal title bars, brand-colored dots, monospace typography, decorative whoami/cat prompts and a static cursor. Profile text and three LinkedIn links are preserved. No command execution or input handling was added. Production build including TypeScript and static export audit passed. Desktop and 390×844 browser inspections confirm four cards, responsive columns and no horizontal overflow. No full browser test suite was run for this visual revision.


### Industries section removed — 6 November 2026
Removed the industries section component, its page invocation and unused typed content. Production build including TypeScript and static export checks passed. Parsed the exported section order: expertise is followed directly by work, with no industries section/title present.


## Project gallery and Octaclub — 6 November 2026
Replaced case-study rows with three tall reference-inspired gradient cards, app-style monograms, distinct decorative SVG artwork and native expandable details. Desktop uses three columns; smaller screens use a horizontally scrollable snap gallery. Six Senses and ThaaerFit retain their approved descriptions, details and external destinations.

Replaced Medical Club with Octaclub using the user's clarification: evolved platform for medical and technical disciplines across all Jordanian universities, self-directed learning and THINK AI. Removed the former university association, status and medclubhu.com URL; no new URL or launch status was inferred.

Production build including TypeScript and export audit passed. Export text confirms Octaclub/THINK AI and no Medical Club, Hashemite University or old URL. Browser inspection confirms three cards, functional Octaclub details, mobile horizontal card scrolling and zero document horizontal overflow at 390×844. Warning/error logs were empty. No full browser test suite or physical-device performance measurement was run.


## Product gallery styling — 6 November 2026
THINK and OCTACARE now reuse the project gallery card styles: gradients, app monograms, decorative SVG illustrations and native arrow disclosures. Development status remains visible; all original product content is retained. Desktop uses two columns; mobile uses horizontal scroll snapping.
Production build including TypeScript and static export checks passed. Compared all product source strings against exported text successfully. Browser checks confirmed two product cards, unchanged three project cards, six/five vision items, keyboard disclosure opening/closing and zero horizontal document overflow at 390×844. Captured warning/error logs were empty. No full automated browser suite was run.


## Engineering and Why Octagram redesign — 6 November 2026

- Replaced the engineering rows with five connected stages and a sticky desktop overview; mobile uses a single column.
- Replaced the reasons grid with six asymmetric panels, custom SVG line icons, and a layered architectural illustration.
- Preserved all 36 original content strings in both sections; verified against the static export.
- Production build and checks.mjs passed. Browser review at 1440px and 390px: five stages, six reasons, no page horizontal overflow, no warning/error logs. Reviewed mobile after reload to refresh the existing scroll choreography.
- No new runtime dependencies or animations; reduced-motion disables the panel hover transitions.


## Integrated journey — 6 November 2026

- Integrated seven lit 3D studies into section introductions; services retain the existing wheel. One shared WebGL context, adaptive particle counts, hidden/offscreen suspension and disposal.
- Unified typography, gutters, section rhythm and card spacing. Preserved every original exported text fragment (HTMLParser comparison).
- Removed ScrollTrigger's document refresh path in favor of camera-only damping; native anchors remain authoritative. Corrected initial hash positioning after font layout without overriding visitor interaction.
- Production build / TypeScript passed; checks.mjs passed. Deterministic particle-form validation passed for all eight form buffers: distinct, finite and bounded.
- Browser at 1440×1000 and 390×844: no horizontal page overflow, one canvas, no warning/error logs observed. Deep-link landing at 100px on mobile after fonts.
- Verified sculpture rotation (0 to 0.79 radians), pause (canvas removed, vector fallback visible, controls hidden), resume, service selection with keyboard and next/back controls, product details, mobile menu/Escape, and local project-brief dialog with synthetic data; no submission or external communication.
- Final exit gate suppresses globe overlap at the team handoff. Static reduced-motion rules reviewed; device-wide OS preference and physical-device performance were not measured.


## Shared service-card design — 6 November 2026

- Supersedes the integrated-sculpture experiment above. Removed ChapterArt, ChapterSculptures, chapter-forms and chapter-objects, their UI and imports. Original brain, logo, globe and original ambient scene remain.
- Shared BrandPanels flat artwork, section bars, palette, panel geometry and typography across team, mission, projects, products, engineering, why and contact. Original narrative copy uses the same panel frame. Services retain their existing wheel.
- Build/TypeScript and checks.mjs passed. Export text comparison against the pre-experiment site found no missing content. No data-sculpture elements or new sculpture controls remain.
- Desktop 1440px: reviewed why/project cards; OCTACLUB disclosure opens with keyboard. Mobile 390px: five engineering cards in a 330px single column; no page overflow.
- New sidebar and pointer-light handlers removed. Retained native scrolling, initial hash positioning fix, modest print hover/reveal and pause/reduced-motion handling.


## Distinct compositions, shared identity — 6 November 2026

- Supersedes the repeated service-cover treatment. Flat service prints now remain in Services only. Team uses terminal windows; mission uses open numbered columns; work uses the approved project illustrations; products use two full-width feature panels; engineering uses the connected timeline; why uses an asymmetric grid.
- Shared typography, colors, header bars and spacing retained. No additional 3D objects or controls.
- Build/TypeScript and checks.mjs passed. Original approved export text comparison found no missing fragments; no repeated brand-print or data-sculpture markup remains.
- Browser reviewed at 1440px and 390px: product disclosures open/close from keyboard, five principles reflow to ruled mobile rows, no horizontal overflow and no warning/error logs. Original services wheel and original 3D source modules unchanged.
