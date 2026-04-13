"use client";

/**
 * LLDModule.tsx — Thin re-export for backward compatibility.
 *
 * The monolith has been split into focused files under src/components/modules/lld/:
 *   - constants.ts          — Shared constants, color maps, type definitions, helper functions
 *   - canvas/LLDCanvas.tsx  — UML class diagram canvas with zoom/pan, drag, connection handles
 *   - canvas/SequenceDiagramCanvas.tsx — Sequence diagram SVG canvas with playback
 *   - canvas/StateMachineCanvas.tsx    — State machine SVG canvas with simulation
 *   - sidebar/LLDSidebar.tsx           — All sidebar browsers and panels
 *   - panels/LLDProperties.tsx         — Property panels for all modes
 *   - panels/LLDBottomPanels.tsx       — Bottom explanation panels, generated code, tabs
 *   - panels/PatternQuiz.tsx           — Pattern identification quiz
 *   - panels/SOLIDQuiz.tsx             — SOLID violation quiz
 *   - panels/InterviewPractice.tsx     — Practice timer, assessment, setup
 *   - hooks/useLLDModule.ts            — Main hook orchestrating all state + handlers
 *   - index.ts                         — Barrel export
 *
 * See LLD-037 for the refactoring task details.
 */

export { useLLDModule } from "./lld";
