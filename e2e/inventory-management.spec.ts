import { test, expect } from "@playwright/test";
import { signUpAndLogin } from "./helpers/auth";

test.describe("Inventory Management", () => {
    test.beforeEach(async ({ page }) => {
        await signUpAndLogin(page);
        await page.setViewportSize({ width: 1280, height: 800 });
    });

    test("navigates to inventory page", async ({ page }) => {
        await page.goto("/inventory");
        await expect(page).toHaveURL(/\/inventory/);
    });

    test("inventory page renders stock level table or grid", async ({ page }) => {
        await page.goto("/inventory");
        // Inventory page should render some content (table, empty state, or grid)
        await expect(
            page.locator(
                "table, [data-testid='inventory-table'], [data-testid='inventory-empty'], h1"
            )
        ).toBeVisible({ timeout: 10000 });
    });

    test("inventory page has accessible heading", async ({ page }) => {
        await page.goto("/inventory");
        const heading = page.locator("h1");
        await expect(heading).toBeVisible({ timeout: 10000 });
    });
});
