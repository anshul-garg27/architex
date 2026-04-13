# ADR-004: App Router over Pages Router

**Status:** Accepted

**Date:** 2024

## Context

Architex is built on Next.js 16. The framework offers two routing paradigms:

1. **Pages Router** (`pages/`) -- The legacy router with `getServerSideProps`, `getStaticProps`, and file-based routing under `pages/`.
2. **App Router** (`app/`) -- The modern router with React Server Components (RSC), nested layouts, streaming, and the `app/` directory convention.

The application is primarily a single-page interactive tool (the main workspace lives at `/`), but also includes:

- Authentication pages (`/sign-in`, `/sign-up`).
- A blog with static content (`/blog`, `/blog/[slug]`).
- Concept pages with SEO content (`/concepts/[slug]`).
- Problem pages (`/problems`, `/problems/[slug]`).
- A landing page (`/landing`).
- API routes for diagrams, templates, challenges, AI evaluation, and webhooks.
- SEO files (`robots.ts`, `sitemap.ts`, OG image generation).

## Decision

Use the **App Router** exclusively. No `pages/` directory exists in the project.

## Rationale

1. **Server Components for content pages.** The blog, concepts, and problems pages benefit from RSC -- they can fetch data and render HTML on the server without shipping JavaScript for those components to the client. The main workspace at `/` is marked `"use client"` since it is entirely interactive.

2. **Nested layouts.** The App Router's layout system is used for route-group-specific layouts:

   ```
   src/app/
     layout.tsx              -- Root layout (ThemeProvider, metadata)
     page.tsx                -- Main workspace ("use client")
     (auth)/
       sign-in/[[...sign-in]]/page.tsx
       sign-up/[[...sign-up]]/page.tsx
     blog/
       page.tsx              -- Blog index
       [slug]/page.tsx       -- Blog post
     landing/
       layout.tsx            -- Landing-specific layout (no workspace chrome)
       page.tsx
   ```

   The `(auth)` route group uses Clerk's catch-all route convention `[[...sign-in]]`. The landing page has its own layout that omits the workspace activity bar and panels.

3. **API Route Handlers.** The App Router's `route.ts` convention replaces Pages Router API routes:

   ```
   src/app/api/
     diagrams/route.ts          -- CRUD for saved diagrams
     diagrams/[id]/route.ts     -- Single diagram operations
     templates/route.ts         -- Template listing
     challenges/route.ts        -- Challenge data
     evaluate/route.ts          -- AI evaluation endpoint
     health/route.ts            -- Health check
     hint/route.ts              -- AI hint generation
     og/route.tsx               -- Dynamic OG image generation
     email-preview/route.ts     -- Email template preview
     webhooks/clerk/route.ts    -- Clerk webhook handler
   ```

4. **Metadata API.** The App Router provides typed metadata exports used for SEO:

   ```ts
   // src/app/layout.tsx
   export const metadata: Metadata = {
     title: "Architex",
     description: "...",
     // ...
   };
   ```

   Dynamic OG images are generated via `src/app/api/og/route.tsx` using Next.js ImageResponse.

5. **SEO files.** `robots.ts` and `sitemap.ts` at the app root use the App Router convention for generating `robots.txt` and `sitemap.xml` programmatically.

6. **Loading and error boundaries.** The App Router provides `loading.tsx`, `error.tsx`, and `global-error.tsx` at the route level:

   ```
   src/app/
     loading.tsx        -- Suspense fallback for the workspace
     error.tsx          -- Route-level error boundary
     global-error.tsx   -- Root error boundary
   ```

7. **Middleware.** `src/middleware.ts` uses the App Router middleware convention for request-level logic (e.g., authentication checks, redirects).

8. **Future-proofing.** The Pages Router is in maintenance mode. New Next.js features (Server Actions, Parallel Routes, Intercepting Routes) are App Router only.

## Consequences

### Positive

- Clean separation between server-rendered content (blog, concepts) and client-rendered interactive workspace.
- Route groups and nested layouts reduce duplication.
- Built-in streaming and Suspense integration for progressive loading.
- SEO-friendly content pages with zero client JS overhead.

### Negative

- The `"use client"` directive is required on the main workspace and all interactive components. The codebase has this directive on every component file under `src/components/` and `src/app/page.tsx`.
- Some third-party libraries (e.g., React Flow, cmdk) are client-only, requiring careful boundary placement.
- Developers must understand the RSC model to avoid accidentally importing client code into server components.

## References

- Root layout: `src/app/layout.tsx`
- Main workspace: `src/app/page.tsx` (`"use client"`)
- Auth routes: `src/app/(auth)/`
- API routes: `src/app/api/`
- Middleware: `src/middleware.ts`
- SEO: `src/app/robots.ts`, `src/app/sitemap.ts`
- Error boundaries: `src/app/error.tsx`, `src/app/global-error.tsx`
- Next.js config: `next.config.ts`
- Package: `next` 16.2.3 in `package.json`
