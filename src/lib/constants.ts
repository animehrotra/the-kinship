export const circleLabels: Record<string, string> = {
  inner_circle: "Inner Circle",
  close: "Close",
  casual: "Casual",
  reconnect: "Reconnect",
};

export const circleOptions = [
  { value: "inner_circle", label: "Inner Circle" },
  { value: "close", label: "Close" },
  { value: "casual", label: "Casual" },
  { value: "reconnect", label: "Reconnect" },
] as const;

export const nudgeFrequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const intervalUnitOptions = [
  { value: "day", label: "Day(s)" },
  { value: "week", label: "Week(s)" },
  { value: "month", label: "Month(s)" },
] as const;

export function formatNudgeInterval(value: number, unit: string): string {
  const labels: Record<string, [string, string]> = {
    day: ["day", "days"],
    week: ["week", "weeks"],
    month: ["month", "months"],
  };
  const [singular, plural] = labels[unit] || [unit, unit];
  return `Every ${value} ${value === 1 ? singular : plural}`;
}
