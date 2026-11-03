# Week 1 — The SOLID Principles

The foundation week. Each principle gets one day: first spot the violation, then
refactor to the clean version. Day 6 combines all five into a design-from-scratch
challenge, and Day 7 is self-assessment.

## Running it

```bash
npm install          # one-time: installs tsx + typescript + @types/node
npm start            # run the Day 6 reference program (Food Delivery System)
npm run typecheck    # strict type-check (tsc --noEmit)
npm run dev -- Day6/Food_Delivery_System.ts   # run any file: npm run dev -- <path>
```

- **Strict mode is on** (`tsconfig.json`), so the compiler itself flags many
  SOLID smells for you.
- `moduleDetection: "force"` isolates each file, so the same top-level names
  (`Order`, `OrderStatus`, …) reused across days don't collide.
- `npm run typecheck` currently covers **Day 6** — the one complete, runnable
  program. Days 1–5 `*_applied.ts` are teaching fragments (see the note below)
  and are brought under the type-check in a later enhancement; you can still run
  any file with `npm run dev -- <path>`.

## Daily Breakdown

| Day | Principle | Core Idea | Notes |
| --- | --- | --- | --- |
| [Day 1](./Day1/Readme.md) | **SRP** — Single Responsibility | A class should have one reason to change — one stakeholder. | [Readme](./Day1/Readme.md) |
| [Day 2](./Day2/Readme.md) | **OCP** — Open/Closed | Open for extension, closed for modification. Add behaviour via new classes, not edits. | [Readme](./Day2/Readme.md) |
| [Day 3](./Day3/Readme.md) | **LSP** — Liskov Substitution | A subtype must honour the parent's behavioural contract, not just its signatures. | [Readme](./Day3/Readme.md) |
| [Day 4](./Day4/Readme.md) | **ISP** — Interface Segregation | No client should depend on methods it doesn't use. Prefer small, focused interfaces. | [Readme](./Day4/Readme.md) |
| [Day 5](./Day5/Readme.md) | **DIP** — Dependency Inversion | High-level modules own the interfaces; infrastructure depends on them, not the reverse. | [Readme](./Day5/Readme.md) |
| [Day 6](./Day6/Challenge.md) | **Combined** | Design a Food Delivery Order System applying all five principles from a blank slate. | [Challenge](./Day6/Challenge.md) |
| Day 7 | **Assessment** | Phase 1–3 self-assessments + a hotel booking practice problem. | — |

## How Each Day Is Organised

```
DayN/
  Readme.md              # the principle: core idea, the smell, the test
  violations.ts          # "before" — the anti-pattern
  <PRINCIPLE>_applied.ts  # "after" — the refactor
  Challenge/             # a second worked example of the same principle
```

> Note: the `*_applied.ts` files for Days 1–5 are **teaching fragments**. They
> reference ambient dependencies (`db`, `sendgrid`, `CartItem`, `Order`, …) that
> aren't defined in the file, so they illustrate the shape of a refactor rather
> than compiling standalone. Day 6's `Food_Delivery_System.ts` is the complete,
> runnable program.

## How the Principles Connect

- **OCP is why SRP exists** — isolate each responsibility behind an interface and a
  new variant becomes a new class, never an edit to the orchestrator.
- **OCP depends on LSP** — the Strategy pattern only works if every strategy is a
  genuine, substitutable implementation of its contract.
- **ISP prevents LSP violations** — a fat interface forces implementers to stub or
  throw on methods they don't support; split it and the type system does the
  enforcement for you.
- **DIP ties it together** — the high-level module defines the abstractions; payment
  gateways, repositories, and notifiers all depend inward toward the business logic.

## Day 6 Challenge — Quick Reference

Design a food delivery system where:

- **SRP** — validation, pricing, payment, notification, and persistence are separate classes.
- **OCP** — new discount types, payment methods, and delivery models require zero edits (Strategy pattern).
- **LSP** — every payment method honours the payment contract (COD's max-order limit is the trap).
- **ISP** — notification recipients get different channel combinations; no single fat notifier interface.
- **DIP** — `OrderService` has zero imports from gateways, providers, or DB clients.

See [Day6/Food_Delivery_System.ts](./Day6/Food_Delivery_System.ts) for a reference solution.
