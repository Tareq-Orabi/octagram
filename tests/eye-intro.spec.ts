import { test, expect } from "@playwright/test";

test("closed eye opens and enters the pupil before revealing usable content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const phases: string[] = [];
    (window as Window & { eyePhases?: string[] }).eyePhases = phases;
    new MutationObserver(() => {
      const phase =
        document.querySelector<HTMLElement>(".eye-intro")?.dataset.eyePhase;
      if (phase && phases.at(-1) !== phase) phases.push(phase);
    }).observe(document, { attributes: true, childList: true, subtree: true });
  });
  await page.goto("/");
  await expect(page.locator(".eye-intro")).toBeHidden({ timeout: 12_000 });
  const phases = await page.evaluate(
    () => (window as Window & { eyePhases?: string[] }).eyePhases,
  );
  expect(phases).toEqual([
    "closed",
    "opening",
    "open",
    "entering",
    "revealing",
  ]);
  await expect(page.locator("html")).not.toHaveClass(
    /site-loading|site-entering/,
  );
  await expect(page.locator(".eye-intro-canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator(".header .brand").click();
});

for (const method of ["button", "Escape", "Tab"]) {
  test(`intro can be bypassed with ${method}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator(".eye-intro-canvas")).toBeVisible();
    if (method === "button")
      await page.getByRole("button", { name: "Skip intro" }).click();
    else await page.keyboard.press(method);
    await expect(page.locator(".eye-intro")).toBeHidden();
    await expect(page.locator("html")).not.toHaveClass(
      /site-loading|site-entering/,
    );
  });
}

test("deep links and explicit skip preserve direct access", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const url of ["/#work", "/?skiploader"]) {
    await page.goto(url);
    await expect(page.locator(".eye-intro")).toBeHidden();
    await expect(page.locator(".eye-intro-canvas")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/site-loading/);
  }
});

test("blocked scene assets cannot trap the visitor behind the eye", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/assets/models/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".eye-intro")).toBeHidden({ timeout: 12_000 });
  await expect(page.locator("html")).not.toHaveClass(
    /site-loading|site-entering/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("without JavaScript the site remains available without the intro", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4175/");
  await expect(page.locator(".eye-intro")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});
