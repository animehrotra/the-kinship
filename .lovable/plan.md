# Kinship — Product Requirements Document

## 1. Objective

Kinship is a personal CRM that helps individuals maintain meaningful relationships with friends, family, and acquaintances. It provides structured nudges, interaction tracking, and life event awareness so that no important relationship fades due to the busyness of daily life.

## 2. Key Problems Solved

- **Relationships fade silently.** People lose touch not because they stop caring, but because they forget to reach out. Kinship replaces guilt with gentle, scheduled reminders.
- **No structured way to track personal connections.** Unlike professional CRMs (HubSpot, Salesforce), there is no lightweight tool built for personal relationships.
- **Important dates are forgotten.** Birthdays, anniversaries, and milestones slip through the cracks without a centralized place to track them.
- **Outreach feels random.** Without a system, people either over-contact some and neglect others. Circle-based organization brings intentionality.

## 3. Target Users

- **Primary:** Busy professionals (25-45) who value close relationships but struggle to maintain them consistently.
- **Secondary:** People managing large social circles (community organizers, extroverts relocating to new cities, remote workers).
- **Anti-persona:** Sales professionals looking for a pipeline tool. Kinship is personal, not transactional.

## 4. Key Features

### Built (Current)

| Feature | Description |
|---|---|
| **Authentication** | Email/password signup and login with password visibility toggle, persistent sessions, and secure password reset (no user enumeration). |
| **Landing Page** | Marketing page with value proposition and feature highlights. |
| **Dashboard (Nudges)** | Central hub showing: circle summary (reached vs. total this month), overdue contacts, paginated upcoming nudges with dates and frequency labels, and upcoming life events (30-day window). |
| **Contact Management** | Full CRUD: add, edit, delete (with confirmation), and archive/restore contacts. Fields include name, phone, email, birthday, notes, circle tier. |
| **Circle Organization** | Five tiers: Inner Circle, Friends, Acquaintances, Family, Others. Filterable on the People page. |
| **Flexible Nudge Frequency** | Interval-based system: "Every X day(s)/week(s)/month(s)" with optional start and end date boundaries. Start date anchors the first nudge calculation. |
| **Interaction Logging** | Log interactions (texted, called, met up, video call) from both the contact detail page and directly from dashboard nudge cards. Automatically recalculates next nudge date. |
| **Life Events** | Track birthdays, anniversaries, and custom events with month/day selection and optional yearly recurrence. Shown on contact detail and dashboard. |
| **Tags** | Create, assign, and remove color-coded tags on contacts. Tag picker with inline creation on contact detail page. Tags assigned during contact creation. |
| **Search & Filter** | Search contacts by name and filter by circle on the People page. |
| **Archive** | Soft-delete contacts to archive; restore from dedicated Archive page. |

### Planned

| Feature | Description |
|---|---|
| **Clear birthday field** | Allow resetting birthday to empty in edit forms. |

## 5. User Flows

### Onboarding
```
Landing Page -> Sign Up -> Email Verification -> Login -> Empty Dashboard -> "Add someone" CTA
```

### Core Loop (Daily Use)
```
Open Dashboard -> See overdue/upcoming nudges -> Tap chat icon to log interaction
                                                  OR tap contact name to view detail
-> Interaction logged -> Next nudge recalculated -> Return to dashboard
```

### Contact Management
```
People page -> Search/filter -> Tap contact (view) | Pencil (edit) | Trash (delete)
            -> "Add someone" button -> Fill form (name, circle, nudge interval, tags, dates) -> Save
```

### Life Events
```
Contact Detail -> "Add" life event -> Select type (Birthday/Anniversary/Custom)
              -> Pick month & day -> Save -> Appears on dashboard if within 30 days
```

## 6. Success Metrics

| Metric | Target | Rationale |
|---|---|---|
| **Weekly Active Users (WAU)** | Steady growth, >50% of registered users | Indicates habitual use |
| **Interactions Logged / User / Week** | 3+ | Core engagement signal |
| **Nudge Response Rate** | >60% of nudges result in a logged interaction within 48 hrs | Proves nudges drive action |
| **Contacts per User** | 10+ after 30 days | Indicates investment in the tool |
| **Retention (Day 30)** | >40% | Personal CRM stickiness |
| **Archive Rate** | <15% of contacts archived | Low = contacts remain relevant |

## 7. Future Roadmap

| Priority | Feature | Description |
|---|---|---|
| **P0** | Push/email notifications | Deliver nudges outside the app so users don't need to open it proactively. |
| **P0** | Mobile PWA / native feel | Install prompt, offline support, and app-like experience. |
| **P1** | Notes on interactions | Allow adding freeform notes when logging an interaction (partially supported, not surfaced in UI). |
| **P1** | Bulk actions | Multi-select contacts for bulk archive, tag, or circle reassignment. |
| **P1** | Import contacts | CSV or Google Contacts import to reduce onboarding friction. |
| **P2** | Relationship insights | Monthly summary: who you reached, who you missed, streak tracking. |
| **P2** | Shared contacts | Allow partners/families to share a contact and coordinate outreach. |
| **P2** | Smart suggestions | AI-powered conversation starters based on life events and interaction history. |
| **P3** | Calendar integration | Sync nudges to Google/Apple Calendar as reminders. |
| **P3** | Communication channel links | Deep-link to WhatsApp, iMessage, or phone dialer from a contact card. |
