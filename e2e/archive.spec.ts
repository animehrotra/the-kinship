import { test, expect } from "../playwright-fixture";
import { signUpTestUser } from "./helpers";

test.describe("Archive & Restore", () => {
  test("can archive a contact and restore it", async ({ page }) => {
    await signUpTestUser(page);

    // Create a contact
    await page.goto("/people");
    await page.getByRole("button", { name: "Add someone" }).click();
    await page.getByLabel("Name *").fill("Archive Test");
    await page.getByRole("button", { name: "Add to your circle" }).click();
    await expect(page.getByText("Archive Test")).toBeVisible({ timeout: 5000 });

    // Go to contact detail
    await page.getByText("Archive Test").click();
    await expect(page.locator("h1")).toContainText("Archive Test");

    // Click Archive button
    await page.getByTitle("Archive").click();

    // Should redirect to /people and contact should be gone
    await page.waitForURL("/people", { timeout: 5000 });
    await expect(page.getByText("Archive Test")).not.toBeVisible();

    // Go to archive page
    await page.goto("/archive");
    await expect(page.getByText("Archive Test")).toBeVisible();

    // Restore the contact
    await page.getByRole("button", { name: "Restore" }).click();

    // Contact should disappear from archive
    await expect(page.getByText("Archive Test")).not.toBeVisible({ timeout: 5000 });

    // Verify it's back in People
    await page.goto("/people");
    await expect(page.getByText("Archive Test")).toBeVisible({ timeout: 5000 });
  });
});
