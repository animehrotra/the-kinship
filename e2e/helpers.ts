import { Page } from "@playwright/test";

/**
 * Signs up a new test user via the UI and waits for redirect to dashboard.
 * Uses a unique email based on timestamp to avoid collisions.
 */
export async function signUpTestUser(page: Page) {
  const timestamp = Date.now();
  const email = `test-${timestamp}@example.com`;
  const password = "testpass123";
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
  
  // With auto-confirm enabled, user is signed in immediately and redirected
  await page.waitForURL("/", { timeout: 10000 });

  return { email, password, name };
}
