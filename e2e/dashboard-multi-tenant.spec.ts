import { test, expect } from "@playwright/test";

test.describe("Dashboard Multi-Tenant Isolation", () => {
  test("organizations see only their own branches", async ({ browser }) => {
    // Create two separate browser contexts (isolated sessions)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Organization A: Sign up
    await pageA.goto("http://localhost:3000/signup");
    await pageA.fill('input[name="fullName"]', "Owner A");
    await pageA.fill('input[name="shopName"]', "Shop A");
    await pageA.fill('input[name="email"]', `ownera-${Date.now()}@test.com`);
    await pageA.fill('input[name="password"]', "password123");
    await pageA.fill('input[name="confirmPassword"]', "password123");
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL("**/dashboard");

    // Organization B: Sign up
    await pageB.goto("http://localhost:3000/signup");
    await pageB.fill('input[name="fullName"]', "Owner B");
    await pageB.fill('input[name="shopName"]', "Shop B");
    await pageB.fill('input[name="email"]', `ownerb-${Date.now()}@test.com`);
    await pageB.fill('input[name="password"]', "password123");
    await pageB.fill('input[name="confirmPassword"]', "password123");
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL("**/dashboard");

    // Org A: Create a branch
    await pageA.goto("http://localhost:3000/branches");
    await pageA.click("text=Add Branch");
    await pageA.fill('input[name="name"]', "Branch A1");
    await pageA.click('button:has-text("Create Branch")');
    await pageA.waitForTimeout(1000);

    // Org B: Create a branch
    await pageB.goto("http://localhost:3000/branches");
    await pageB.click("text=Add Branch");
    await pageB.fill('input[name="name"]', "Branch B1");
    await pageB.click('button:has-text("Create Branch")');
    await pageB.waitForTimeout(1000);

    // Verify isolation: Org A should NOT see Branch B1
    await pageA.reload();
    await expect(pageA.locator("text=Branch A1")).toBeVisible();
    await expect(pageA.locator("text=Branch B1")).not.toBeVisible();

    // Verify isolation: Org B should NOT see Branch A1
    await pageB.reload();
    await expect(pageB.locator("text=Branch B1")).toBeVisible();
    await expect(pageB.locator("text=Branch A1")).not.toBeVisible();

    // Cleanup
    await contextA.close();
    await contextB.close();
  });

  test("organization settings show only own data", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Sign up
    await page.goto("http://localhost:3000/signup");
    const email = `owner-${Date.now()}@test.com`;
    await page.fill('input[name="fullName"]', "Test Owner");
    await page.fill('input[name="shopName"]', "Test Shop");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Navigate to settings
    await page.goto("http://localhost:3000/settings");

    // Verify organization details
    await expect(page.locator('input[name="name"]')).toHaveValue("Test Shop");
    await expect(page.locator("text=" + email)).toBeVisible();

    await context.close();
  });
});
