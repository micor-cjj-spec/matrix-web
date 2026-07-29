Follow the repository-wide instructions in `/AGENTS.md`.

Canonical task workflows are stored under `/.agents/skills/`.

Before changing frontend code:

1. Identify the affected route, feature, component library, and backend contract.
2. Read every applicable skill referenced by `AGENTS.md`.
3. Handle loading, empty, error, permission, and success states deliberately.
4. Review duplicate writes, request races, financial presentation, accessibility, and responsive behavior.
5. Run `npm run build` and report validation and remaining risks.

Do not duplicate the canonical rules in this file.
