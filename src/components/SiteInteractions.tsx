"use client";

import { useEffect } from "react";
import { contactEmail } from "@/lib/site-config";
import { readMotionPreference } from "@/lib/experience-preferences";

/** Progressive enhancement for the server-rendered content. Every subscription is scoped to this mount. */
export default function SiteInteractions() {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.classList.toggle("js-motion", !reduced.matches && !readMotionPreference());
    const timers = new Set<number>();
    const objectUrls = new Set<string>();
    const frames = new Set<number>();
    function later(callback: () => void, delay: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!signal.aborted) callback();
      }, delay);
      timers.add(timer);
      return timer;
    }
    function frame(callback: () => void) {
      const id = requestAnimationFrame(() => {
        frames.delete(id);
        if (!signal.aborted) callback();
      });
      frames.add(id);
      return id;
    }
    function query<T extends Element>(selector: string): T {
      const element = document.querySelector<T>(selector);
      if (!element) throw new Error(`Missing page element: ${selector}`);
      return element;
    }
    function listen<E extends Event>(
      target: EventTarget,
      type: string,
      listener: (event: E) => void,
      options: AddEventListenerOptions = {},
    ) {
      target.addEventListener(type, listener as EventListener, {
        ...options,
        signal,
      });
    }
    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (
            entry.target.closest(".hero") &&
            !root.classList.contains("experience-entered")
          )
            return;
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }),
      { threshold: 0, rootMargin: "0px 0px -2% 0px" },
    );
    const revealElements = [
      ...document.querySelectorAll<HTMLElement>(
        ".hero [data-reveal], .side-copy h2, .side-copy p, .manifesto-copy p, .section-intro h2, .section-intro>p, .team-head h2, .contact h2",
      ),
    ];
    // Keep server-rendered line wrapping intact: measuring and rebuilding every
    // line after fonts load changed section heights and forced synchronous layout.
    function prepareText() {
      if (signal.aborted) return;
      revealElements.forEach((element) => revealObserver.observe(element));
    }
    prepareText();
    listen<MediaQueryListEvent>(reduced, "change", (event) => {
      root.classList.toggle("js-motion", !event.matches && !readMotionPreference());
      if (event.matches) enterExperience(true);
      else prepareText();
      window.dispatchEvent(
        new CustomEvent<boolean>("octagram:motion", { detail: event.matches || readMotionPreference() }),
      );
    });

    // Resource readiness releases the eye's final camera move; the eye owns timing.
    const loader = query<HTMLDivElement>(".site-loader");
    const ready = { font: false, image: false, scene: false };
    let entered = false, entryRequested = false;
    const showLoader =
      !root.dataset.introTimedOut &&
      !root.dataset.introRecovered &&
      !reduced.matches &&
      !readMotionPreference() &&
      !new URLSearchParams(location.search).has("skiploader") &&
      (!location.hash || location.hash === "#home");
    delete loader.dataset.eyeReady;
    function enterExperience(immediate = false) {
      if (entered || signal.aborted) return;
      entered = true;
      root.classList.remove("site-loading");
      root.classList.add("experience-entered");
      if (!immediate && showLoader) root.classList.add("site-entering");
      document
        .querySelectorAll(".hero .split-reveal")
        .forEach((element) => element.classList.add("in-view"));
      window.dispatchEvent(new CustomEvent("octagram:entered"));
      later(
        () => {
          root.classList.remove("site-entering");
          loader.hidden = true;
          root.dataset.heroVisible = "true";
          if (root.dataset.heroIntro) root.dataset.heroIntro = immediate ? "skipped" : "finished";
          window.dispatchEvent(new Event("octagram:hero-visible"));
        },
        immediate ? 0 : 450,
      );
    }
    function updateReadiness() {
      if (!entered && !signal.aborted && Object.values(ready).every(Boolean))
        loader.dataset.eyeReady = "true";
    }
    function requestEntry() {
      if (entered || entryRequested) return;
      entryRequested = true;
      if (root.dataset.heroLayoutReady) { enterExperience(); return; }
      if (!root.dataset.heroPrepared) {
        root.dataset.heroPrepared = "true";
        window.dispatchEvent(new Event("octagram:hero-prepare"));
      }
      // Wait for stable typography, then let the visible hero perform its decode.
      later(enterExperience, 1300);
    }
    listen(window, "octagram:hero-layout-ready", () => { if (entryRequested) enterExperience(); });
    listen(window, "octagram:intro-complete", requestEntry);
    listen(window, "octagram:intro-skip", () => enterExperience(true));
    root.dataset.introCoordinated = "true";
    if (showLoader) {
      root.dataset.heroIntro ??= "pending";
      root.classList.add("site-loading");
      loader.hidden = false;
    } else enterExperience(true);
    void document.fonts.ready.then(() => {
      if (!signal.aborted) {
        ready.font = true;
        updateReadiness();
      }
    });
    const heroPoster = query<HTMLImageElement>(".brain-poster");
    const posterReady = () => {
      ready.image = true;
      updateReadiness();
    };
    if (heroPoster.complete) posterReady();
    else {
      listen(heroPoster, "load", posterReady, { once: true });
      listen(heroPoster, "error", posterReady, { once: true });
    }
    function sceneReady() {
      if (
        root.dataset.motionProfile === "compact" ||
        root.classList.contains("has-brain") ||
        root.classList.contains("fallback-brain")
      ) {
        ready.scene = true;
        updateReadiness();
      }
    }
    const readyObserver = new MutationObserver(sceneReady);
    readyObserver.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });
    sceneReady();
    listen<CustomEvent<string>>(window, "octagram:ready", (event) => {
      if (event.detail === "brain" || event.detail === "fallback") {
        ready.scene = true;
        updateReadiness();
      }
    });
    // Failed resources cannot hold the visitor behind the opening.
    if (showLoader) later(requestEntry, 8500);
    listen<KeyboardEvent>(document, "keydown", (event) => {
      if (!entered && ["Tab", "Escape"].includes(event.key))
        enterExperience(true);
    });

    const header = query<HTMLElement>(".header");
    let scrollFrame = 0;
    let scrollLimit = Math.max(0, root.scrollHeight - root.clientHeight);
    let lastScroll = Math.max(0, Math.min(scrollLimit, window.scrollY));
    let travel = 0, compactHeader = false;
    function measureScrollLimit() {
      scrollLimit = Math.max(0, root.scrollHeight - root.clientHeight);
      lastScroll = Math.min(lastScroll, scrollLimit);
    }
    function updateScrollUI() {
      scrollFrame = 0;
      const position = Math.max(0, Math.min(scrollLimit, window.scrollY));
      const delta = position - lastScroll;
      lastScroll = position;
      // Keep the dock stable through tiny reversals and viewport rubber-banding.
      if (delta) travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      const next = position <= 4 ? false : Math.abs(travel) >= 9 ? travel > 0 : compactHeader;
      if (position <= 4 || Math.abs(travel) >= 9) travel = 0;
      if (next !== compactHeader) {
        compactHeader = next;
        header.classList.toggle("is-compact", next);
      }
    }
    listen(
      window,
      "scroll",
      () => {
        if (!scrollFrame) scrollFrame = frame(updateScrollUI);
      },
      { passive: true },
    );
    const headerLayout = new ResizeObserver(measureScrollLimit);
    headerLayout.observe(query("main"));
    listen(window, "resize", measureScrollLimit, { passive: true });

    const dialog = query<HTMLDialogElement>("#brief-dialog");
    const form = query<HTMLFormElement>("#contact-form");
    const preview = query<HTMLPreElement>("#brief-preview");
    const status = query<HTMLParagraphElement>("#brief-status");
    let briefText = "";
    listen<SubmitEvent>(form, "submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const value = (key: string) => String(data.get(key) || "").trim();
      briefText = `OCTAGRAM — PROJECT BRIEF\n\nName: ${value("name")}\nEmail: ${value("email")}\nInterest: ${value("interest")}\n\nTHE IDEA\n${value("message")}`;
      preview.textContent = briefText;
      query<HTMLElement>("#brief-person").textContent = value("name");
      query<HTMLElement>("#brief-email").textContent = value("email");
      query<HTMLElement>("#brief-interest").textContent = value("interest");
      query<HTMLElement>("#brief-idea").textContent = value("message");
      query<HTMLAnchorElement>("#whatsapp-brief").href = `https://wa.me/962780668491?text=${encodeURIComponent(briefText)}`;
      status.textContent = "";
      if (contactEmail) {
        const link = query<HTMLAnchorElement>("#email-brief");
        link.hidden = false;
        link.href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Project inquiry — ${value("interest")}`)}&body=${encodeURIComponent(briefText)}`;
        query<HTMLParagraphElement>("#brief-help").textContent =
          "Review your brief, then open your email app to send it. Nothing is sent automatically.";
      }
      dialog.showModal();
    });
    listen(query(".close-dialog"), "click", () => dialog.close());
    listen<MouseEvent>(dialog, "click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
    listen(query("#copy-brief"), "click", async () => {
      try {
        await navigator.clipboard.writeText(briefText);
        if (!signal.aborted)
          status.textContent = "Brief copied. Ready when you are.";
      } catch {
        if (signal.aborted) return;
        preview.closest("details")?.setAttribute("open", "");
        const range = document.createRange();
        range.selectNodeContents(preview);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        status.textContent =
          "Brief selected. Use your device’s Copy command, or download it below.";
      }
    });
    listen(query("#download-brief"), "click", () => {
      const url = URL.createObjectURL(
        new Blob([briefText], { type: "text/plain;charset=utf-8" }),
      );
      objectUrls.add(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = "octagram-project-brief.txt";
      document.body.append(link);
      link.click();
      link.remove();
      const timer = window.setTimeout(() => {
        URL.revokeObjectURL(url);
        objectUrls.delete(url);
        timers.delete(timer);
      }, 1500);
      timers.add(timer);
      status.textContent =
        "Your brief has been downloaded. Nothing has been sent.";
    });

    return () => {
      controller.abort();
      revealObserver.disconnect();
      readyObserver.disconnect();
      headerLayout.disconnect();
      header.classList.remove("is-compact");
      frames.forEach(cancelAnimationFrame);
      timers.forEach(clearTimeout);
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      root.classList.remove(
        "js-motion",
        "js-carousel",
        "site-loading",
        "site-entering",
        "experience-entered",
      );
      loader.hidden = true;
      if (dialog.open) dialog.close();
    };
  }, []);
  return null;
}
