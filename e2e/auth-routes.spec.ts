import { test, expect } from "@playwright/test";

test.describe("Route Protection (Unauthenticated)", () => {
  test("redirects /dashboard to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /pos to /login when not authenticated", async ({ page }) => {
    await page.goto("/pos");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /inventory to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/inventory");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /products to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /sales to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/sales");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /reports to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("allows access to /login when not authenticated", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText("Welcome back");
  });

  test("allows access to /signup when not authenticated", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator("h1")).toContainText("Create your account");
  });
});
