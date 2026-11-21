export type PassageBounds = { vision: number; roots: number; height: number };
export const passageBoundary = (bounds: PassageBounds) => bounds.roots - bounds.height * .28;
export const crossesPassage = (from: number, to: number, bounds: PassageBounds) =>
  to > from && from <= passageBoundary(bounds) && to >= passageBoundary(bounds) && from + bounds.height >= bounds.vision;
/** A finite forward clip can hold the page until it finishes or is skipped. */
export function createPassageScrollGate(options: {
  bounds: () => PassageBounds | undefined;
  enabled: () => boolean;
  start: (keyboard: boolean) => void;
  skip: (arrive?: boolean) => void;
}) {
  const root = document.documentElement;
  const abort = new AbortController(), { signal } = abort;
  let locked = false, consumed = false, hold = 0, previous = scrollY, touchY = 0, timeout = 0;
  let bypass = location.hash && !["#home", "#vision"].includes(location.hash) ? performance.now() + 1500 : 0;
  let saved = { overflow: "", overscroll: "", behavior: "" };
  const editable = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest("input,textarea,select,[contenteditable=true]"));
  const canBegin = () => !locked && !consumed && performance.now() >= bypass && options.enabled();
  const begin = (keyboard = false) => {
    const bounds = options.bounds();
    if (!bounds || !canBegin()) return false;
    hold = passageBoundary(bounds); locked = true;
    saved = { overflow: root.style.overflow, overscroll: root.style.overscrollBehavior, behavior: root.style.scrollBehavior };
    root.style.overflow = "hidden"; root.style.overscrollBehavior = "none"; root.style.scrollBehavior = "auto";
    root.classList.add("passage-locked"); root.dataset.passageLocked = "true";
    window.scrollTo({ top: hold, behavior: "instant" }); previous = hold;
    timeout = window.setTimeout(() => { if (locked) options.skip(); }, 6500);
    options.start(keyboard);
    return true;
  };
  const attempt = (from: number, to: number, keyboard = false) => {
    const bounds = options.bounds();
    return Boolean(bounds && crossesPassage(from, to, bounds) && begin(keyboard));
  };
  const release = (arrive = true) => {
    if (!locked) return;
    clearTimeout(timeout); locked = false;
    consumed = true;
    root.style.overflow = saved.overflow; root.style.overscrollBehavior = saved.overscroll; root.style.scrollBehavior = saved.behavior;
    root.classList.remove("passage-locked"); delete root.dataset.passageLocked;
    const bounds = options.bounds();
    if (arrive && bounds) window.scrollTo({
      top: bounds.roots,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
    previous = scrollY;
  };
  const handleLockedInput = (delta: number, event: Event) => {
    if (!locked) return false;
    if (delta < 0) options.skip(false);
    else event.preventDefault();
    return true;
  };
  window.addEventListener("wheel", event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (handleLockedInput(delta, event)) return;
    if (editable(event.target)) return;
    if (event.target instanceof Element && event.target.closest(".flip-card__scroll,.service-card-content,dialog[open]")) return;
    if (attempt(scrollY, scrollY + delta)) event.preventDefault();
  }, { passive: false, capture: true, signal });
  window.addEventListener("touchstart", event => { if (event.touches.length === 1) touchY = event.touches[0].clientY; }, { passive: true, signal });
  window.addEventListener("touchmove", event => {
    if (event.touches.length !== 1 || editable(event.target)) return;
    const y = event.touches[0].clientY, delta = touchY - y; touchY = y;
    if (handleLockedInput(delta, event)) return;
    if (event.target instanceof Element && event.target.closest(".flip-card__scroll,.service-card-content,dialog[open]")) return;
    if (attempt(scrollY, scrollY + delta)) event.preventDefault();
  }, { passive: false, signal });
  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && locked) { event.preventDefault(); options.skip(); return; }
    if (editable(event.target)) return;
    if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) return;
    if (event.key === " " && event.target instanceof Element && event.target.closest("button,a,summary")) return;
    // An explicit Home seek remains available.
    const delta = event.key === "Home" ? -Infinity : event.key === "ArrowDown" ? 48 : event.key === "ArrowUp" ? -48 : event.key === "PageUp" || (event.key === " " && event.shiftKey) ? -innerHeight * .88 : event.key === "End" ? Infinity : innerHeight * .88;
    if (handleLockedInput(delta, event)) return;
    if (event.key === "Home") { bypass = performance.now() + 1500; return; }
    if (attempt(scrollY, scrollY + delta, true)) event.preventDefault();
  }, { capture: true, signal });
  window.addEventListener("scroll", () => {
    const y = scrollY, bounds = options.bounds();
    if (locked) {
      if (Math.abs(y - hold) > 1) window.scrollTo({ top: hold, behavior: "instant" });
      previous = hold; return;
    }
    if (bounds && y < passageBoundary(bounds) - bounds.height * .32) consumed = false;
    attempt(previous, y);
    previous = scrollY;
  }, { passive: true, signal });
  document.addEventListener("click", event => {
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href^='#']") : null;
    if (!anchor) return;
    bypass = performance.now() + 1500;
    if (locked) options.skip(false);
    consumed = false;
  }, { capture: true, signal });
  return {
    get locked() { return locked; },
    release,
    refresh() { const bounds = options.bounds(); if (locked && bounds) { hold = passageBoundary(bounds); window.scrollTo({ top: hold, behavior: "instant" }); previous = hold; } },
    dispose() { abort.abort(); clearTimeout(timeout); release(false); },
  };
}
