import { test, expect } from "../playwright-fixture";
import { signUpTestUser } from "./helpers";

test.describe("Log an Interaction", () => {
  test("can log an interaction and see it in history", async ({ page }) => {
    await signUpTestUser(page);

    // Create a contact first
    await page.goto("/people");
    await page.getByRole("button", { name: "Add someone" }).click();
    await page.getByLabel("Name *").fill("Interaction Test");
    await page.getByRole("button", { name: "Add to your circle" }).click();
    await expect(page.getByText("Interaction Test")).toBeVisible({ timeout: 5000 });

    // Navigate to contact detail
    await page.getByText("Interaction Test").click();
    await expect(page.locator("h1")).toContainText("Interaction Test");

    // Click "Log interaction"
    await page.getByRole("button", { name: "Log interaction" }).click();

    // Select "Texted" (default) and save
    await expect(page.getByText("Log interaction with Interaction Test")).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();

    // Verify interaction appears in History
    await expect(page.getByText("History")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Texted")).toBeVisible();
  });
});
