# Kinship — Personal Relationships App

> Never lose touch with the people who matter most.

Kinship is a personal relationships app that helps you maintain meaningful connections with friends, family, and acquaintances through structured nudges, interaction tracking, and life event awareness.

## Key Features

- **Circle Organization** — Categorize contacts into Inner Circle, Friends, Acquaintances, Family, and Others
- **Smart Nudges** — Flexible interval-based reminders ("Every X days/weeks/months") so no relationship fades
- **Interaction Logging** — Track texts, calls, meetups, and video calls with one tap
- **Life Events** — Remember birthdays, anniversaries, and custom milestones
- **Tags** — Color-coded labels for organizing contacts your way
- **Push Notifications** — Browser-based reminders delivered daily for overdue nudges
- **Feedback Widget** — Submit suggestions and ideas directly from the app
- **Archive** — Soft-delete contacts and restore them anytime

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS v3, shadcn/ui |
| Backend | Lovable Cloud (auth, database, edge functions, storage) |
| State | TanStack React Query |
| Routing | React Router v6 |

## Getting Started

1. Open the project in [Lovable](https://lovable.dev)
2. The app runs automatically in the preview panel
3. Sign up with email and password to start adding contacts

## Project Structure

```
src/
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utilities, auth, constants
├── pages/         # Route-level page components
└── integrations/  # Lovable Cloud client & types

supabase/
└── functions/     # Backend edge functions
```

## Documentation

- **[Plan](.lovable/plan.md)** — Product requirements, features, and roadmap
- **[Notes](NOTES.md)** — Personal scratchpad for ideas and quick to-dos
