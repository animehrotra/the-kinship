import { test, expect } from "../playwright-fixture";

test.describe("Authentication", () => {
  test("sign-in form renders correctly", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("toggling to sign-up shows name field", async ({ page }) => {
    await page.goto("/auth");

    await page.getByText("Need an account? Sign up").click();

    await expect(page.getByText("Create account")).toBeVisible();
    await expect(page.getByLabel("Your name")).toBeVisible();
  });

  test("sign up with valid credentials shows confirmation message", async ({ page }) => {
    await page.goto("/auth");
    await page.getByText("Need an account? Sign up").click();

    const email = `test-${Date.now()}@example.com`;
    await page.getByLabel("Your name").fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Testpass123!");

    await page.getByRole("button", { name: "Create account" }).click();

    // Auto-confirm is off — user should see "Check your email" and stay on auth page
    await expect(page.getByText("Check your email")).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test("toggle back from sign-up to sign-in", async ({ page }) => {
    await page.goto("/auth");
    await page.getByText("Need an account? Sign up").click();
    await expect(page.getByLabel("Your name")).toBeVisible();

    await page.getByText("Already have an account? Sign in").click();
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel("Your name")).not.toBeVisible();
  });
});
