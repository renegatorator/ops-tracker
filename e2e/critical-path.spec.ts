import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD;

test.describe("critical path", () => {
  test("login, issues list, open first issue", async ({ page }) => {
    test.skip(
      !email || !password,
      "set E2E_EMAIL and E2E_PASSWORD to a real user with user_profiles and at least one issue",
    );

    await page.goto("/en/login");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/en\/dashboard/, { timeout: 30_000 });

    await page.goto("/en/issues");
    await expect(page.getByRole("heading", { name: /issues/i })).toBeVisible({
      timeout: 30_000,
    });

    const firstIssue = page
      .getByTestId("issues-table")
      .locator("tbody a[href*='/issues/']")
      .first();
    const count = await firstIssue.count();
    test.skip(count === 0, "seed at least one issue for this user in Supabase");

    await firstIssue.click();
    await expect(page).toHaveURL(/\/en\/issues\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i, {
      timeout: 30_000,
    });
  });
});
