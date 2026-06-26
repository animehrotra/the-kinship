export type OnboardingTip = {
  id: string;
  title: string;
  body: string;
};

// Tips for existing users — rotates through; once dismissed never reappears.
// Append new tips at the end; old users will see them next.
export const ONBOARDING_TIPS: OnboardingTip[] = [
  {
    id: "tags",
    title: "Group people with tags",
    body: "Use tags like Family, Mentors, or Work to organize and filter your people.",
  },
  {
    id: "life-events",
    title: "Never miss a birthday",
    body: "Add birthdays and milestones on a contact's page — they'll show up under Upcoming events.",
  },
  {
    id: "backdating",
    title: "Forgot to log a catch-up?",
    body: "When logging an interaction, you can backdate it to any past date.",
  },
  {
    id: "push",
    title: "Get nudges on your phone",
    body: "Enable push notifications from the sidebar to be reminded wherever you are.",
  },
  {
    id: "frequency",
    title: "Custom contact cadence",
    body: "Open any contact to set exactly how often you'd like to reach out — weekly, monthly, or your own interval.",
  },
  {
    id: "feedback",
    title: "We read every note",
    body: "Tap 'Share feedback' in the sidebar to send us ideas or report a bug.",
  },
  {
    id: "archive",
    title: "Quiet a contact without losing them",
    body: "Archive people you want to keep but no longer be nudged about. Restore anytime from the Archive page.",
  },
];

export const TIP_THROTTLE_DAYS = 3;
