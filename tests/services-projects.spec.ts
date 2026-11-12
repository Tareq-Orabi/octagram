import { test, expect } from "@playwright/test";

test("all projects share one section and Octaclub is in development", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?skiploader#work");
  await expect(page.locator("#work .flip-card")).toHaveCount(5);
  await expect(page.locator("#project-list .flip-card")).toHaveCount(2);
  await expect(page.locator("#work #innovation .flip-card")).toHaveCount(3);
  await expect(page.locator("section#innovation")).toHaveCount(0);
  const club = page
    .locator("#innovation")
    .getByRole("article", { name: "OCTACLUB project" });
  await expect(club).toContainText("In development");
  await club.getByRole("button", { name: "Explore OCTACLUB" }).click();
  await expect(club.getByRole("region")).toContainText("Learning focus");
  await club.getByRole("button", { name: "Return to OCTACLUB front" }).click();
  await expect(
    club.getByRole("button", { name: "Explore OCTACLUB" }),
  ).toBeVisible();
});

test("service wheel resumes after hover, closing, leaving and dragging outside", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?skiploader#expertise");
  const gallery = page.locator(".service-gallery");
  const first = page.locator('[data-service="0"]');
  const assertOrbiting = async () => {
    await expect(gallery).toHaveClass(/is-spinning/);
    const before = await first.evaluate(
      (element) => getComputedStyle(element).transform,
    );
    await expect
      .poll(() =>
        first.evaluate((element) => getComputedStyle(element).transform),
      )
      .not.toBe(before);
  };
  await assertOrbiting();
  await first.hover({ force: true });
  await assertOrbiting();
  await first.getByRole("button").click({ force: true });
  await expect(page.locator(".service-card.is-selected h3")).toHaveText(
    "Web Development",
  );
  await page.getByRole("button", { name: "Next service", exact: true }).click();
  await expect(page.locator(".service-card.is-selected h3")).toHaveText(
    "Mobile App Development",
  );
  await page.getByRole("button", { name: "All services", exact: true }).click();
  await assertOrbiting();
  await page
    .getByRole("button", { name: "Explore services", exact: true })
    .click();
  await page.locator('.header a[href="#work"]').click();
  await expect(page.locator(".service-card.is-selected")).toHaveCount(0);
  await page.locator('.header a[href="#expertise"]').click();
  await assertOrbiting();
  const viewport = await page.locator(".service-viewport").boundingBox();
  if (!viewport) throw new Error("Service viewport is missing");
  const x = viewport.x + viewport.width / 2;
  const y = viewport.y + viewport.height * 0.44;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(4, 30, { steps: 12 });
  await page.mouse.up();
  await assertOrbiting();
  await page
    .getByRole("button", { name: "Explore services", exact: true })
    .click();
  await expect(page.locator(".service-card.is-selected h3")).toHaveText(
    "Web Development",
  );
});
