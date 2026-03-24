export const circleLabels: Record<string, string> = {
  inner_circle: "Inner Circle",
  friends: "Friends",
  acquaintances: "Acquaintances",
  family: "Family",
  others: "Others",
};

export const circleOptions = [
  { value: "inner_circle", label: "Inner Circle" },
  { value: "friends", label: "Friends" },
  { value: "acquaintances", label: "Acquaintances" },
  { value: "family", label: "Family" },
  { value: "others", label: "Others" },
] as const;

export const nudgeFrequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};
