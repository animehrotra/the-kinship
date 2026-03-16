

# Kinship — Personal Relationship Manager

## Overview
A warm, spacious app to nurture relationships with friends and family. Circles prioritize closeness, tags add context, and a dashboard highlights who needs attention — all backed by Supabase for cross-device sync.

## Pages & Navigation
- **Sidebar** (desktop) / **Bottom bar** (mobile) with three tabs: **Nudges** (dashboard), **People**, **Archive**
- **Auth pages**: Sign up / Sign in (email + password)

## Nudges Dashboard (Home)
- **"It's been a while"** section: Cards for overdue contacts, sorted by days since last interaction
- **Upcoming life events**: Birthdays, anniversaries in the next 30 days
- **Circle summary**: Quick count of how each circle is doing (e.g., "Inner Circle — 2 of 5 reached this month")
- Warm amber dot for overdue, emerald dot for recently contacted

## People List
- Single-column feed of contact cards (`max-w-2xl`)
- Filter by **Circle** (Inner Circle, Close Friends, Extended) and/or **Tags** (Family, College, Work, etc.)
- Each card shows: Name, circle tier, last interaction type + date, nudge indicator
- "Add Someone" button to create a new contact

## Contact Detail Page
- Large name, circle badge, tags
- **"Log Interaction"** button — opens a quick sheet to pick type (Texted, Called, Met up, Video call) and set next nudge interval
- **Life Events** timeline: Add milestones like "Moved to Chicago," "Started new job," "Baby born"
- **"Last seen"** timestamp + **"Next nudge"** countdown
- Edit circle, tags, and contact details

## Contact Creation / Editing
- Fields: Name, phone (optional), email (optional), birthday, notes
- Assign to a Circle (required) and Tags (optional)
- Set initial nudge frequency (e.g., every 2 weeks, monthly, quarterly)

## Backend (Supabase via Lovable Cloud)
- **Auth**: Email/password sign-up and login
- **Tables**: profiles, contacts, interactions, life_events, tags, contact_tags, user_roles
- **RLS**: All data scoped to authenticated user

## Design
- Warm stone palette (`stone-50` background, white cards, sage green actions, amber nudge indicators)
- Geist Sans typography, spacious layout, rounded cards
- Gentle interactions: hover shifts, scale-98 tap, toast confirmations ("Updated Sarah's timeline")
- Empty state: "Your inner circle starts here."

