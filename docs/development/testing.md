# Testing Strategy & Guidelines

This document outlines the testing strategy, tools, and best practices for the VapeTrack PH application. Our goal is to maintain high code quality, prevent regressions, and ensure a reliable experience for our users.

## 1. Testing Philosophy (The Testing Pyramid)

We follow the standard testing pyramid to balance confidence with execution speed and maintenance cost:

1.  **End-to-End (E2E) Tests (Fewest):** High confidence, tests critical user journeys against a fully running system. These are slower and potentially more brittle.
2.  **Integration Tests (Moderate):** Tests how multiple pieces of the application work together (e.g., a React component interacting with a Zustand store and mocked API).
3.  **Unit Tests (Most):** Fast, isolated tests for individual functions, hooks, or small UI components.

## 2. Testing Stack

Our current and planned testing stack includes:

*   **E2E Testing:** [Playwright](https://playwright.dev/) (Currently configured)
*   **Unit/Integration Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) *(Planned/Recommended)*
*   **API/Database Mocks:** [MSW (Mock Service Worker)](https://mswjs.io/) or direct Supabase client mocking.
*   **Static Analysis:** TypeScript & ESLint (Currently configured)

---

## 3. End-to-End (E2E) Testing with Playwright

Playwright is currently set up in the project and is used to test critical business flows (e.g., Authentication, POS Checkout, Inventory Management).

### Running E2E Tests

```bash
# Run tests in headless mode
npm run test:e2e

# Run tests with UI mode for debugging
npm run test:e2e:ui
```

### Best Practices for E2E

1.  **Test Critical Paths:** Focus on flows that would cause significant business impact if broken (e.g., Staff login, adding a product, processing a sale).
2.  **Use Data-Test IDs:** Rely on `data-testid` attributes or semantic accessible roles (e.g., `getByRole('button', { name: /checkout/i })`) rather than brittle CSS classes or fragile DOM structures.
3.  **Isolate State:** Each test should start with a clean state. Use Playwright's setup/teardown hooks or a dedicated testing database branch to ensure tests don't interfere with each other.
4.  **Mock Third-Party Services:** If testing flows that rely on external APIs (other than our own Supabase DB in a controlled environment), mock those network requests using Playwright's `page.route()`.

---

## 4. Unit & Integration Testing (Vitest + RTL)

*Note: This section outlines the strategy for when Vitest and React Testing Library are integrated into the repository.*

### Unit Testing

Focus on testing pure functions, custom hooks, and isolated utility functions in `lib/` or `utils/`.

*   **Focus:** Input vs. Output, edge cases, error handling.
*   **Tools:** Vitest.

### Component Integration Testing

Focus on testing React components using React Testing Library (RTL).

*   **Focus:** User interactions (clicks, typing), accessibility (roles, labels), and conditional rendering based on state.
*   **Rule of Thumb:** Test components exactly as a user would interact with them. Avoid testing implementation details (e.g., internal component state).

```tsx
// Example pseudo-code for a component test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

test('calls onClick when clicked', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  
  await userEvent.click(screen.getByRole('button', { name: /click me/i }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## 5. State Management Testing (Zustand)

Zustand stores should be tested by importing the store and directly invoking actions, then asserting on the new state.

### Best Practices for Zustand

1.  **Mocking the Store:** When testing React components that rely on Zustand, you might need to mock the store or provide a clean initial state for each test.
2.  **Testing Store Logic in Isolation:** Extract complex logic into pure functions outside the slice, or test the store directly (as a unit) without mounting React components.

---

## 6. Database & Backend Testing (Supabase)

Testing interactions with Supabase (both Client Components and Server Actions) requires careful environment management.

1.  **Local Supabase Environment:** For Integration and E2E tests, it is highly recommended to run tests against a local instance of Supabase (`npx supabase start`). This ensures your Row Level Security (RLS) policies and database functions behave correctly without mutating production.
2.  **Mocking the Client:** For fast unit tests of UI components, mock the `createClient` function entirely so that tests do not hit the network.
3.  **Testing Server Actions:** Server actions should be tested similarly to API endpoints. Invoke the action with mocked inputs and assert on the returned data or side effects (using a test database).

---

## 7. Continuous Integration (CI)

Our goal is to integrate these tests into a CI pipeline (e.g., GitHub Actions) to run automatically on every Pull Request.

**Proposed Pipeline Flow:**
1.  Code Checkout.
2.  Install dependencies (`npm ci`).
3.  Run Linter and Typecheck (`npm run lint` & `tsc --noEmit`).
4.  Run Unit/Integration Tests.
5.  Start Local Supabase (if needed) & Next.js Dev Server.
6.  Run Playwright E2E Tests.

If any step fails, the Pull Request cannot be merged.
