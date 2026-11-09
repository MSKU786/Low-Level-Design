# Week 2 — OOP Fundamentals

The building blocks week. Where Week 1 was the five SOLID *principles*, Week 2 is
the four OOP *pillars* that make them possible — encapsulation, inheritance vs
composition, polymorphism & generics, and abstraction — plus a day on UML. Each
coding day follows the same rhythm: spot the violation, refactor to the clean
version, then apply it in a practice problem. Day 6 combines everything into a
design-from-scratch capstone, and Day 7 is self-assessment.

## Running it

```bash
npm install          # one-time: installs tsx + typescript + @types/node + vitest
npm start            # run the Day 6 capstone (Library Management System)
npm test             # run the test suite (vitest)
npm run typecheck    # strict type-check (tsc --noEmit)
npm run dev -- Day2/Inhertiance_and_Composition/composition_fix.ts   # run any file
```

- **Strict mode is on** (`tsconfig.json`), so the compiler flags many OOP smells
  for you.
- `moduleDetection: "force"` isolates each file, so the same top-level names
  reused across days don't collide.
- `npm run typecheck` currently covers **Day 6** — the one complete capstone.
  Other days include runnable demos and teaching fragments (see the note below);
  run any of them with `npm run dev -- <path>`.

## Daily Breakdown

| Day | Topic | Core Idea |
| --- | --- | --- |
| [Day 1](./Day1/Readme.md) | **Encapsulation** | Hide internal state behind a small surface; expose behaviour, not fields. |
| [Day 2](./Day2/Readme.md) | **Inheritance vs Composition** | `IS-A` vs `HAS-A`. Favour composition over inheritance — but know when inheritance is the right call. |
| [Day 3](./Day3/Readme.md) | **Polymorphism & Generics** | One interface, many behaviours; generics reuse code across types without losing type safety. |
| [Day 4](./Day4/Readme.md) | **Abstraction** | Abstract class (shared implementation) vs interface (pure contract) — choose by whether subtypes need shared code or just a shared shape. |
| [Day 5](./Day5/Readme.md) | **UML** | The diagrams that matter for LLD: class & sequence first, then state, activity, use-case; and how to read every relationship arrow. |
| Day 6 | **Capstone** | Design a Library Management System applying the OOP pillars + SOLID from a blank slate. |
| Day 7 | **Assessment** | Phase 1–3 self-assessments + an online examination system practice problem. |

## How Each Day Is Organised

```
DayN/
  Readme.md              # the concept: core idea, the smell, the fix
  <Concept>/             # "before" (violation) and "after" (fix) worked examples
  Practice/              # a second problem applying the same concept
```

## What Runs vs What Teaches

- **Complete, runnable programs** (`npm run dev -- <path>`):
  `Day6/Library_Management_System.ts` (the capstone, also `npm start`),
  `Day2/.../inhertiance_explostion.ts`, `Day2/.../composition_fix.ts`,
  `Day2/Practice/HR_Management_System.ts`, `Day4/Abstraction/Plugin.ts`,
  `Day4/Challenge/Report_Generation_System.ts`,
  `Day7/phase3_online_examination_system.ts`.
- **Teaching fragments** — the Day 1 and Day 3 `*_applied` / `*_repo` files
  illustrate the *shape* of a refactor and may reference ambient dependencies
  that aren't defined in the file, so they don't all compile standalone yet.

## How the Concepts Connect

- **Encapsulation comes first** — if state isn't hidden, nothing below it is safe
  to change; a leaky object breaks every pattern built on top of it.
- **Composition needs encapsulation** — you can only swap a `HAS-A` collaborator
  cleanly when each part hides its internals behind a small interface.
- **Polymorphism & generics are how composition pays off** — a composed object
  depends on an abstraction, and many implementations (or type arguments) slot in
  behind it without duplication.
- **Abstraction names the contract** — abstract classes share implementation,
  interfaces share shape; both are what the Day 6 capstone's repositories,
  notifiers, and services depend on.
