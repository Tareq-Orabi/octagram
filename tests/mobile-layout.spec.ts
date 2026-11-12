import { test, expect } from "@playwright/test";

test("phone projects are complete, stacked and readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 430]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/?skiploader#work");
    const cards = page.locator("#work .flip-card");
    await expect(cards).toHaveCount(5);
    const boxes = await cards.evaluateAll((items) =>
      items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
    );
    for (let index = 0; index < boxes.length; index++) {
      expect(boxes[index].left).toBeGreaterThanOrEqual(0);
      expect(boxes[index].right).toBeLessThanOrEqual(width);
      if (index)
        expect(boxes[index].top).toBeGreaterThan(boxes[index - 1].bottom);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page
      .getByRole("button", { name: "Explore OCTACLUB", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "OCTACLUB", exact: true }),
    ).toContainText("In development");
    await page
      .getByRole("button", { name: "Return to OCTACLUB front", exact: true })
      .click();
  }
});

test("opening a service on a short phone reveals its details and navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?skiploader#expertise");
  await page
    .getByRole("button", { name: "Explore services", exact: true })
    .click();
  const selected = page.locator(".service-card.is-selected");
  await expect(selected.locator("h3")).toHaveText("Web Development");
  await expect
    .poll(async () => {
      const card = await selected.boundingBox();
      const header = await page.locator(".header").boundingBox();
      const controls = await page
        .locator(".service-gallery-controls")
        .boundingBox();
      return Boolean(
        card &&
        header &&
        controls &&
        card.y >= header.y + header.height + 6 &&
        card.y + card.height <= controls.y + 1 &&
        controls.y + controls.height <= 568,
      );
    })
    .toBe(true);
  await page.getByRole("button", { name: "Next service", exact: true }).click();
  await expect(selected.locator("h3")).toHaveText("Mobile App Development");
  await page.getByRole("button", { name: "All services", exact: true }).click();
  await expect(page.locator(".service-gallery")).toHaveClass(/is-spinning/);
});
