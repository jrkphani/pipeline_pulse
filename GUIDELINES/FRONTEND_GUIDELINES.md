# Frontend Development Guidelines

This document provides guidelines for developing the frontend of the Pipeline Pulse application. Consistency in our codebase is crucial for maintainability and collaboration.

## 1. Technology Stack

-   **Framework:** React with Vite
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS with shadcn/ui components
-   **State Management:** Zustand
-   **Data Fetching:** React Query (`@tanstack/react-query`)
-   **Routing:** React Router (`react-router-dom`)
-   **Forms:** React Hook Form (`react-hook-form`) with Zod for validation

## 2. Code Style & Structure

-   **File Structure:** Group files by feature or page within the `src/` directory (e.g., `src/pages/Dashboard/`, `src/components/auth/`).
-   **Component Naming:** Use PascalCase for component files and function names (e.g., `DealCard.tsx`, `function DealCard()`).
-   **Hooks:** Custom hooks should be prefixed with `use` (e.g., `useFilteredDeals.ts`).
-   **Services:** API interaction logic should be abstracted into services (e.g., `src/services/api.ts`).
-   **Types:** Define TypeScript types in a dedicated `src/types/` directory or alongside the feature they relate to.

## 3. Component Design

-   **Composition over Inheritance:** Build complex components by composing smaller, single-purpose components.
-   **Use `shadcn/ui`:** Whenever possible, use or extend components from the `shadcn/ui` library to maintain UI consistency. Find them in `src/components/ui/`.
-   **Props:** Use clear and descriptive prop names. Provide default values for optional props where appropriate.

## 4. State Management

-   **Local State:** Use `useState` for state that is local to a single component.
-   **Global State:** Use `zustand` for state that needs to be shared across multiple components. Our stores are located in `src/stores/`.
    -   `useAuthStore`: For user authentication state.
    -   `useAppStore`: For application-level state like filters and user preferences.
    -   `useUIStore`: For UI-specific state like theme and sidebar status.
-   **Server State:** Use React Query (`@tanstack/react-query`) for managing server state (caching, refetching, etc.). Do not store server data directly in Zustand.

## 5. Data Fetching

-   **Centralized API Service:** All backend API calls should be made through the `apiService` in `src/services/api.ts`. This provides a single point for configuration and error handling.
-   **Use React Query:** Wrap `apiService` calls in custom hooks using `useQuery` for data fetching and `useMutation` for data modification. This gives us caching, automatic refetching, and a consistent way to handle loading and error states.

## 6. Linting & Formatting

-   **ESLint:** The project is configured with ESLint. All code must pass the linting checks before being committed. Run `npm run lint` to check your code.
-   **TypeScript:** Adhere to the TypeScript rules defined in `tsconfig.json`. Avoid using `any` where possible.

## 7. Testing

-   **Playwright:** We use Playwright for end-to-end and integration testing. Test files are located in the `frontend/tests/` directory.
-   **Test Naming:** Test files should be named with a `.spec.ts` extension (e.g., `login.spec.ts`).
-   **Test Coverage:** Aim to write tests for all critical user workflows and UI components.
