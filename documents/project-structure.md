# Project Structure

This document describes how the Cooperstown project is organized, including directories and the rationale behind the approach. The structure follows a **monorepo** style, with a single repository that hosts the Next.js frontend, Amplify backend, and relevant documentation.

---

## 1. Top-Level Directories

1. **app/**
   - Houses Next.js App Router components, including pages, layouts, and global styles.
   - Contains subfolders for specific routes like `chat/page.tsx`.

2. **amplify/**
   - Contains AWS Amplify Gen 2 backend configuration and resources.
   - Auth, Data, and Storage definitions reside here (e.g., `amplify/auth/resource.ts`, `amplify/data/resource.ts`).

3. **components/**
   - Reusable React components (e.g., `Navbar.tsx`, `Footer.tsx`, etc.).

4. **public/**
   - Static assets such as images, icons, and `.svg` files.

5. **documents/**
   - Holds the `.md` files for project documentation (e.g., this file).

---

## 2. Monorepo Approach

- **Single Repository**: Both frontend (Next.js) and backend (Amplify) are in one place for simplicity and unified version control.
- **Shared Dependencies**: Developers can manage all dependencies within a single `package.json` or with minimal separate configuration.
- **Consistent Release**: Ensure that changes in the Amplify backend can be tested and released in tandem with frontend updates.

---

## 3. Frontend Structure

- **app/globals.css**: Global Tailwind and CSS resets.
- **app/layout.tsx**: Root layout that wraps all pages.
- **app/page.tsx**: Landing page route.
- **app/chat/page.tsx**: Chat feature route for logged-in users.

---

## 4. Amplify Structure

- **amplify/backend.ts**: Defines the main backend entry point with references to sub-resources.
- **amplify/auth/**: Authentication configuration (Cognito-based).
- **amplify/data/**: GraphQL schema definitions for channels, messages, and custom mutations.
- **amplify/storage/**: (Optional) For file uploads or storing attachments.

---

## 5. Components Directory

- **Navbar.tsx**: Shared top navigation bar component.
- **Footer.tsx**: Shared footer component.
- **Features.tsx**: Example section block on the landing page.

---

## 6. Rationale

1. **Ease of Navigation**: Clear separation of concerns between app (UI) and amplify (backend).
2. **Collaboration**: Developers can quickly locate relevant code. For instance, changes to the data schema are always in `amplify/data/resource.ts`.
3. **Scalability**: Additional directories or microservices can be added in the future if the architecture evolves.

---

## 7. Future Considerations

- If the project expands drastically, submodules or a multi-repo approach might be considered for microservices or specialized tooling.
- Documentation can be further subdivided by developer docs vs. user docs if needed.

---

## Conclusion

By structuring the Cooperstown project in a monorepo with clear directories, we ensure that both the Next.js frontend and AWS Amplify backend remain consistent and easy to maintain. This layout fosters collaboration, rapid iteration, and a cohesive deployment strategy.