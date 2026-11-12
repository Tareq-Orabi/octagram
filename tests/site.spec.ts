import { test, expect } from "@playwright/test";

test("server HTML, dark-only styling, responsive layout and reduced-motion fallback", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Designing\s*impact\.\s*Engineering\s*beauty\./,
  );
  await expect(page.locator(".project-card")).toHaveCount(3);
  await expect(page.locator("#home [data-poster=brain]")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".site-loader")).toBeHidden();
  await expect(page.locator("html")).not.toHaveClass(/site-loading/);
  await expect(page.locator("html")).toHaveCSS(
    "background-color",
    "rgb(8, 9, 9)",
  );
  await page.evaluate(() => localStorage.setItem("octagram-theme", "light"));
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveCSS(
    "background-color",
    "rgb(8, 9, 9)",
  );
  await expect(page.locator(".theme-toggle")).toHaveCount(0);
  for (const width of [375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page
        .locator(".hero-line")
        .evaluateAll((lines) =>
          lines.every((line) => line.scrollWidth <= line.clientWidth + 1),
        ),
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

test("mobile menu keyboard behavior and reduced-motion service cards", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  await expect(page.locator("#mobile-menu")).toBeVisible();
  await expect(page.locator("#main")).toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await expect(menu).toBeFocused();
  await expect(page.locator(".service-card")).toHaveCount(8);
  await expect(page.locator(".service-card-content li")).toHaveCount(43);
  for (let index = 0; index < 8; index++) {
    await expect(
      page.locator(`[data-service="${index}"] .service-card-content`),
    ).toBeVisible();
  }
});

test("four discipline-specific team profiles show complete biographies", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page.locator(".person-profile");
  await expect(cards).toHaveCount(4);
  await expect(cards.locator(".person-bio p")).toHaveCount(4);
  await expect(cards.getByRole("link")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Next team slide" }),
  ).toHaveCount(0);
});

test("project brief validates, previews and downloads without sending", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const submissions: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") submissions.push(r.url());
  });
  await page.locator(".contact-panel > summary").click();
  await page.getByLabel("Your name").fill("QA Visitor");
  await page.getByLabel("Email address").fill("qa@example.com");
  await page
    .getByLabel("A little about your idea")
    .fill("A real test of the local project brief workflow.");
  await page.getByRole("button", { name: "Prepare project brief" }).click();
  await expect(page.locator("#brief-dialog")).toBeVisible();
  await expect(page.locator("#brief-preview")).toContainText("QA Visitor");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .txt" }).click();
  expect((await download).suggestedFilename()).toBe(
    "octagram-project-brief.txt",
  );
  await page.getByRole("button", { name: "Close project brief" }).click();
  await expect(page.locator("#brief-dialog")).toBeHidden();
  expect(submissions).toEqual([]);
});

test("real WebGL scenes load and survive reverse scroll with dark-only styling", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chrome",
    "Real WebGL integration is exercised in installed Chrome.",
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({
    reducedMotion: "no-preference",
    colorScheme: "dark",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".experience-stage canvas")).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/has-brain/);
  await expect(page.locator("html")).toHaveClass(/experience-entered/);
  await expect(page.locator(".site-loader")).toBeHidden();
  for (const id of ["vision", "jordan", "expertise", "home"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    if (id === "vision")
      await expect(page.locator("html")).toHaveClass(/has-logo/);
    if (id === "jordan")
      await expect(page.locator("html")).toHaveClass(/has-globe/);
  }
  // A layout refresh during a native anchor transition must not strand the visitor mid-page.
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator(".header .brand").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  await expect(page.locator(".theme-toggle")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".experience-stage canvas")).toBeVisible();
  expect(errors).toEqual([]);
});
