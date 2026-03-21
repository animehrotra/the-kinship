import { Page, expect } from "@playwright/test";

/**
 * Signs up a new test user via the UI.
 * With auto-confirm disabled, the user will NOT be redirected —
 * instead we wait for the "Check your email" confirmation toast.
 */
export async function signUpTestUser(page: Page) {
  const timestamp = Date.now();
  const email = `test-${timestamp}@example.com`;
  const password = "Testpass123!";
  const name = "Test User";

  await page.goto("/auth");

  // Switch to sign-up mode
  await page.getByText("Need an account? Sign up").click();

  // Fill the form
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  // Submit
  await page.getByRole("button", { name: "Create account" }).click();

  // With auto-confirm disabled, user stays on auth page and sees confirmation message
  await expect(page.getByText("Check your email")).toBeVisible({ timeout: 10000 });

  return { email, password, name };
}
