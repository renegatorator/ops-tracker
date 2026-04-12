import "server-only";

/**
 * Verifies a reCAPTCHA v3 token against Google's siteverify API.
 *
 * - If `RECAPTCHA_SECRET_KEY` is not configured, verification is skipped and
 *   the function returns `true` so local development works without credentials.
 * - A minimum score of 0.5 is required (0 = bot, 1 = human).
 * - Never throws; returns `false` on network errors.
 */
export const verifyRecaptchaToken = async (
  token: string | null | undefined,
): Promise<boolean> => {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();

  if (!secret) {
    return true;
  }

  if (!token?.trim()) {
    return false;
  }

  try {
    const res = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
        cache: "no-store",
      },
    );
    const json = (await res.json()) as { success: boolean; score?: number };
    return json.success === true && (json.score ?? 1) >= 0.5;
  } catch {
    return false;
  }
};
