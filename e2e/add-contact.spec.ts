import { test, expect } from "../playwright-fixture";
import { signUpTestUser } from "./helpers";

test.describe("Add a Contact", () => {
  test.beforeEach(async ({ page }) => {
    await signUpTestUser(page);
  });

  test("can add a new contact and see it in the list", async ({ page }) => {
    // Navigate to People
    await page.goto("/people");
    await expect(page.getByText("People")).toBeVisible();

    // Click "Add someone"
    await page.getByRole("button", { name: "Add someone" }).click();

    // Fill form
    await page.getByLabel("Name *").fill("Jane Doe");

    // Submit
    await page.getByRole("button", { name: "Add to your circle" }).click();

    // Verify contact appears in the list
    await expect(page.getByText("Jane Doe")).toBeVisible({ timeout: 5000 });
  });

  test("clicking a contact card navigates to detail page", async ({ page }) => {
    await page.goto("/people");
    await page.getByRole("button", { name: "Add someone" }).click();
    await page.getByLabel("Name *").fill("Detail Test");
    await page.getByRole("button", { name: "Add to your circle" }).click();
    await expect(page.getByText("Detail Test")).toBeVisible({ timeout: 5000 });

    // Click the contact card
    await page.getByText("Detail Test").click();

    // Should see the detail page with the contact name
    await expect(page.locator("h1")).toContainText("Detail Test");
    await expect(page).toHaveURL(/\/people\/.+/);
  });
});
