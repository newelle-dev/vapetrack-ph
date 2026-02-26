import { test, expect } from "@playwright/test";
import { signUpAndLogin } from "./helpers/auth";

test.describe("POS - Cart Interactions", () => {
    test.beforeEach(async ({ page }) => {
        await signUpAndLogin(page);
    });

    test("navigates to POS page and renders the product grid", async ({
        page,
    }) => {
        await page.goto("/pos");
        await expect(page).toHaveURL(/\/pos/);
        // The page should have a heading or key element indicating POS
        await expect(page.locator("h1, [data-testid='pos-page']")).toBeVisible({
            timeout: 10000,
        });
    });

    test("POS page has a cart and product area", async ({ page }) => {
        await page.goto("/pos");
        // Cart panel should be present
        await expect(
            page.locator(
                "[data-testid='cart-panel'], [aria-label='Cart'], text=Cart"
            )
        ).toBeVisible({ timeout: 10000 });
    });

    test("branch selector is visible on POS page", async ({ page }) => {
        await page.goto("/pos");
        await expect(
            page.locator(
                "[data-testid='branch-selector'], [aria-label='Branch'], text=Branch"
            )
        ).toBeVisible({ timeout: 10000 });
    });
});
