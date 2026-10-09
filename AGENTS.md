<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:backend-agent-rules -->

# Backend Development Rules

- **Framework**: The backend uses FastAPI (Python) and Alembic for database migrations.
- **Directory**: All backend code resides in the `/backend` directory.
- **Dependencies**: Manage Python dependencies using `backend/requirements.txt`.
- **Database**: When modifying models, always generate an Alembic migration and run it to keep the database in sync.

<!-- END:backend-agent-rules -->

<!-- BEGIN:general-architecture-and-standards -->

# Code Quality, Standards & Architecture

## Architecture
- **Separation of Concerns**: Keep frontend logic (UI, state, API calls) separate from backend logic (business rules, database operations).
- **API Communication**: The frontend must communicate with the backend exclusively through RESTful endpoints defined in FastAPI.
- **Docker First**: All components are orchestrated via Docker Compose. Ensure any architectural changes do not break the containerized workflow.

## Code Quality & Standards
- **Strong Typing**: Use TypeScript for the frontend (avoid `any`) and Python Type Hints for the backend.
- **Clean Code**: Follow SOLID principles. Keep functions small, focused on a single responsibility, and well-named.
- **Formatting & Linting**:
  - Frontend: Follow Prettier and ESLint rules. Ensure zero warnings.
  - Tailwind CSS: Avoid arbitrary classes (e.g. `min-h-[300px]`) when canonical classes exist (e.g. `min-h-75`). Do not introduce code that raises Tailwind or ESLint warnings.
  - Backend: Follow PEP 8 guidelines. Use standard Python formatters/linters (e.g., black, ruff).
- **Documentation**: Provide clear comments for complex logic and maintain up-to-date docstrings for backend functions and classes.
- **Error Handling**: Use structured error handling. The backend should return consistent HTTP status codes and JSON error responses, which the frontend should gracefully handle and display to the user.

<!-- END:general-architecture-and-standards -->
