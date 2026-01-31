---
description: How to build a mobile or web app using Stitch and Antigravity skills
---

# Building Apps with Stitch & Antigravity

This workflow describes how to go from a visual idea to a production-ready React (Web or Mobile) application using Stitch and the newly installed skills.

## Phase 1: Rapid Prototyping (Stitch)

1.  **Generate UI**: Use [Stitch](https://stitch.withgoogle.com) to prompt and generate visual screens.
2.  **Iterate Visuals**: Refine the design directly in Stitch until you have the "vibe" and core screens ready.

## Phase 2: Design Extraction (`design-md`)

1.  **Run Skill**: Use the `design-md` skill to analyze your Stitch project.
2.  **Generate Source of Truth**: This skill will create a `DESIGN.md` file in your repository.
    -   It extracts **Design Tokens** (exact hex codes, spacing, roundness).
    -   It documents the **Atmosphere** (the semantic language used for prompting).
3.  **Review System**: Ensure the `DESIGN.md` accurately represents the design system you want to maintain.

## Phase 3: Code Implementation (`reactcomponents`)

1.  **Run Skill**: Use the `reactcomponents` skill to transform Stitch prototypes into code.
2.  **Modularize**: The skill will:
    -   Break the single-file Stitch HTML into functional **React Components**.
    -   Generate **TypeScript Interfaces** for props.
    -   Move data into `src/data/mockData.ts`.
3.  **Integrate**: Place these components into your `App.tsx` or project structure.

## Phase 4: Continuous Iteration (`stitch-loop`)

1.  **Feedback Loop**: When you need new screens or complex logic updates:
    -   Use the `stitch-loop` skill to sync project state between your local code and the Stitch designer.
    -   This allows you to "re-prompt" Stitch based on existing code context.

## Phase 5: Production Polish

1.  **Theming**: Connect the Tailwind classes extracted in `DESIGN.md` to your `tailwind.config.js`.
2.  **Business Logic**: Replace `mockData.ts` with real API calls or backend integration.
