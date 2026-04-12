import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

/** Port Next must listen on so `webServer.url` matches `use.baseURL` when overridden. */
const devPort = (() => {
  try {
    const { port } = new URL(baseURL);
    if (port !== "") {
      const n = Number.parseInt(port, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    /* fall through */
  }
  return 3000;
})();

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- -p ${String(devPort)}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
