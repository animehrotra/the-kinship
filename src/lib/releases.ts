export type Release = {
  id: string;
  date: string;
  title: string;
  description: string;
  link?: string;
};

// New releases are added here only when their features go live, newest first.
// Keep IDs lexicographically sortable so a single profile marker covers older releases.
export const releases: readonly Release[] = [
  {
    id: "v1.2-phase-1",
    date: "2026-10-03",
    title: "A little help staying in touch",
    description: "Missed a nudge? Kinship reminds you again after two and six weeks. Use Done or Skip on overdue contacts.",
    link: "/dashboard",
  },
  {
    id: "v1.1-phase-0",
    date: "2026-10-03",
    title: "What's new in Kinship",
    description: "See what's new in Kinship right here when features ship.",
  },
];
