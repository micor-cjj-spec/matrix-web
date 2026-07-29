---
name: matrix-ui
description: Design, implement, or revise Matrix Web pages and components. Use for layouts, navigation, dashboards, financial interfaces, responsive behavior, visual consistency, interaction states, accessibility, Element Plus, or Vuetify work.
metadata:
  author: micor
  version: "1.0.0"
---

# Matrix UI Development

## Objective

Build professional, information-dense financial interfaces that remain readable, predictable, and maintainable during long working sessions.

## Required context

Before editing:

1. Read `/AGENTS.md`.
2. Locate the route and neighboring pages.
3. Identify whether the surrounding feature uses Element Plus or Vuetify.
4. Inspect existing shared components, layout containers, formatters, and styles.
5. Confirm the backend contract if the page presents business data.
6. Read `references/design-system.md` for substantial visual work.

## Product character

Matrix UI should feel:

- Professional and restrained.
- Data-oriented and efficient.
- Stable across similar pages.
- Clear about business scope and workflow state.
- Suitable for desktop-heavy enterprise use.

Avoid:

- Decorative gradients without semantic purpose.
- Oversized cards that reduce useful information density.
- Consumer-app interaction patterns that hide business context.
- Emoji as functional icons.
- Motion that delays task completion.
- Unexplained visual variation between similar modules.

## Component-system rule

The repository currently uses both Element Plus and Vuetify.

For each change:

1. Follow the library already used by the surrounding feature.
2. Do not mix the two libraries inside one page unless a shared legacy component requires it.
3. Do not add a third UI library.
4. Prefer shared wrappers and tokens over page-specific overrides.
5. Record intentional exceptions in the change summary.

## Page composition

A route-level page should normally contain:

1. Page title and business context.
2. Primary actions.
3. Search, scope, or filter controls when relevant.
4. Main content area.
5. Loading, empty, error, and permission states.
6. Pagination or summary information where needed.

Keep business context visible. For financial pages, show organization, ledger, currency, and period when those dimensions affect meaning.

## Interaction rules

- Make the primary action visually clear but not oversized.
- Place dangerous actions away from common navigation actions.
- Confirm destructive, posting, reversal, closing, or other high-impact operations.
- Disable repeated actions while requests are pending.
- Preserve user context after recoverable errors.
- Keep navigation and modal behavior predictable.
- Do not use color as the only indication of success, warning, failure, or status.

## Data presentation

- Right-align amounts, quantities, rates, and percentages.
- Use consistent decimal precision and currency presentation.
- Use tabular numerals where the existing typography permits it.
- Prevent status labels from shifting page layout excessively.
- Provide tooltips or expansion for truncated business text.
- Design for unusually large values and long identifiers.
- Keep debit and credit visually distinct through labels and alignment, not color alone.

## Responsive strategy

Matrix is desktop-first, but pages must degrade intentionally:

- Verify at approximately 1280px and 1920px widths.
- Avoid fixed widths that cause unnecessary horizontal overflow.
- Allow wide financial tables to scroll inside a controlled container.
- Collapse secondary filters or actions before hiding primary business context.
- Do not redesign desktop tables as decorative cards unless the use case genuinely requires a mobile view.

## Accessibility

- Controls must be keyboard reachable.
- Inputs must have labels or accessible names.
- Maintain visible focus states.
- Modal focus and close behavior must be predictable.
- Icons that carry meaning need accessible text.
- Error messages must identify the problem and next action.

## Implementation workflow

1. Describe the user task and page states.
2. Identify reusable neighboring patterns.
3. Choose the existing component system for the feature.
4. Define layout, hierarchy, actions, and responsive behavior.
5. Implement with the smallest necessary component surface.
6. Verify long text, large values, loading, empty, error, and permission cases.
7. Run the production build.
8. Review the change with `matrix-frontend-review`.

## Verification

At minimum:

```bash
npm run build
```

Also check:

- Browser console errors.
- Keyboard navigation.
- 1280px and 1920px layouts.
- Long labels and large numeric values.
- Empty and failed API responses.
- Duplicate action prevention.

## Completion report

State:

- Pages and components changed.
- Existing patterns and component library reused.
- States and widths checked.
- Build result.
- Remaining visual or integration risks.
