import { expect, test } from "@playwright/test";

import { routes } from "../src/lib/routes";

const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD;

test.describe("critical path", () => {
  test("login, projects, board, open issue, edit title", async ({ page }) => {
    test.skip(
      !email || !password,
      "set E2E_EMAIL and E2E_PASSWORD to a real user with user_profiles and at least one issue",
    );

    await page.goto(routes.login);
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    await page.goto(routes.projects);
    await expect(page.getByTestId("projects-page-title")).toBeVisible({
      timeout: 30_000,
    });

    const openBtn = page.getByRole("button", { name: /^open$/i }).first();
    const openCount = await openBtn.count();
    test.skip(
      openCount === 0,
      "seed at least one project (e.g. OPS) for this user",
    );

    await openBtn.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+\/board/i, {
      timeout: 30_000,
    });

    const issueLink = page.getByTestId("kanban-issue-link").first();
    const issueCount = await issueLink.count();
    test.skip(
      issueCount === 0,
      "seed at least one issue in a project for this user",
    );

    await issueLink.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+\/issues\/\d+/i, {
      timeout: 30_000,
    });

    const titleInput = page.getByLabel(/^title$/i);
    await titleInput.fill(`E2E title ${Date.now()}`);
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("dashboard overview renders KPIs after login", async ({ page }) => {
    test.skip(!email || !password, "set E2E_EMAIL and E2E_PASSWORD");

    await page.goto(routes.login);
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    await expect(page.getByText(/active projects/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/open issues/i).first()).toBeVisible();
    await expect(page.getByText(/recently updated/i).first()).toBeVisible();
  });

  test("legacy issues list still loads", async ({ page }) => {
    test.skip(!email || !password, "set E2E_EMAIL and E2E_PASSWORD");

    await page.goto(routes.login);
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });

    await page.goto(routes.issues);
    await expect(page.getByRole("heading", { name: /issues/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
