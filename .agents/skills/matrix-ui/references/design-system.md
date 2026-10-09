# Matrix Web Design-System Reference

## Purpose

This reference defines stable visual and interaction principles for Matrix Web. It is not a mandate to rewrite existing pages. Apply it incrementally when creating or revising features.

## 1. Visual hierarchy

Use hierarchy in this order:

1. Page and business context.
2. Primary workflow action.
3. Search or scope controls.
4. Main business data.
5. Secondary summaries and supporting information.

Do not let decorative containers compete with business data.

## 2. Spacing

Use a restrained spacing scale and reuse existing tokens where present.

Recommended conceptual scale:

- 4px: icon/text micro-gap.
- 8px: compact control or inline gap.
- 12px: related controls.
- 16px: normal section padding.
- 24px: section separation.
- 32px: major page separation.

Avoid arbitrary one-off values when a nearby page already establishes a pattern.

## 3. Typography

- Page titles should be clear but not oversized.
- Body and table text must remain readable at enterprise information density.
- Use weight and spacing before relying on additional colors.
- Numeric columns should align consistently.
- Avoid decorative typefaces.

## 4. Color

- Reuse the active component library theme and project variables.
- Use semantic colors for success, warning, error, and information.
- Do not use color as the only status indicator.
- Maintain readable contrast for text, borders, disabled states, and focus indicators.
- Avoid adding custom color values directly to many components; centralize reusable values.

## 5. Surfaces and borders

- Use cards or panels to express grouping, not to wrap every element.
- Prefer subtle borders and restrained shadows.
- Keep table, form, and report surfaces visually consistent within one feature.
- Do not add gradients without a documented semantic purpose.

## 6. Actions

- One clear primary action per local context.
- Secondary actions should not compete with the primary action.
- Dangerous actions require distinct wording and confirmation.
- Avoid ambiguous labels such as “确定” when a precise verb such as “过账” or “冲销” is available.
- Pending actions must communicate progress and prevent duplicate execution.

## 7. Statuses

Status components should include readable text. When practical, also provide an icon, border, or shape difference so status is not color-only.

Keep terminology aligned with backend values and domain language. Do not invent alternative status names for visual convenience.

## 8. Financial values

- Right-align amounts.
- Preserve required decimal precision.
- Include currency when scope is not obvious.
- Distinguish negative values consistently.
- Do not perform authoritative totals with JavaScript floating-point arithmetic.
- Large values should not overlap adjacent columns or controls.

## 9. Tables

- Header labels should be concise and unambiguous.
- Sticky headers or columns should be used only when they improve navigation through wide datasets.
- Dense data is acceptable; illegible data is not.
- Avoid excessive action buttons in every row. Use a compact action group or menu when necessary.
- Horizontal scrolling should remain inside the table region rather than the entire page.

## 10. Forms

- Group fields by business meaning.
- Put required and validation indicators close to labels.
- Keep form actions predictable and visible.
- Preserve input after recoverable server failures.
- Read-only business fields should look read-only, not disabled without explanation.

## 11. Empty, loading, and error states

Loading:

- Show skeletons, spinners, or table loading states appropriate to the content.
- Avoid replacing the entire page for small background refreshes.

Empty:

- Explain whether no data exists or filters produced no results.
- Offer a relevant next action only when permitted.

Error:

- State what failed and what the user can do.
- Preserve filters and form input where possible.
- Do not expose stack traces or sensitive payloads.

## 12. Modals and drawers

- Use modals for focused decisions or compact edits.
- Use drawers when context should remain visible or the content is longer.
- Avoid stacking multiple modals.
- Restore focus when the overlay closes.
- Confirm before closing when unsaved changes would be lost.

## 13. Component-library coexistence

Because Matrix Web currently includes Element Plus and Vuetify:

1. Follow the library used by the feature being changed.
2. Do not mix visual primitives from both libraries in one new page.
3. Wrap repeated patterns behind project components where useful.
4. Do not attempt a broad migration during unrelated feature work.
5. When a feature is intentionally migrated, define the scope and verify all affected interactions.
