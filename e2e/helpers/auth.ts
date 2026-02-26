import { Page } from "@playwright/test";

/**
 * Signs up a new test user and waits for the dashboard to load.
 * Uses a timestamp-based email to guarantee uniqueness per test run.
 * @returns The email used for signup (useful if you need to re-login later)
 */
export async function signUpAndLogin(page: Page): Promise<string> {
    const timestamp = Date.now();
    const email = `e2e-${timestamp}@test.com`;

    await page.goto("/signup");
    await page.fill('input[name="fullName"]', "E2E Test User");
    await page.fill('input[name="shopName"]', `Test Shop ${timestamp}`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    return email;
}
